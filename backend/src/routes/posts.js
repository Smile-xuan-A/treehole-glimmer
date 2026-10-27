/**
 * 帖子相关路由
 * POST /api/posts       - 发布帖子（含图片上传）
 * GET  /api/posts       - 获取帖子列表
 * GET  /api/posts/:id   - 获取帖子详情
 */

const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const sharp = require('sharp')
const { body, validationResult, query } = require('express-validator')

const router = express.Router()
const { query: dbQuery } = require('../db/connection')
const { success, error } = require('../middleware/errorHandler')
const { postLimiter } = require('../middleware/rateLimiter')
const { contentAuditor } = require('../middleware/audit')
const { generateNickname } = require('../utils/nickname')
const { getClientIP, hashIP } = require('../utils/ipHash')
const { formatTimeAgo } = require('../utils/timeFormat')

// ============ 图片上传配置 ============

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../../uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// Multer配置（内存存储，后续处理后写入磁盘）
const storage = multer.memoryStorage()

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 6
  },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('仅支持 JPG/PNG/WebP/GIF 格式'))
    }
  }
})

// ============ 辅助函数 ============

/**
 * 处理并保存图片（去除EXIF + 压缩 + 存储）
 */
async function processAndSaveImage(buffer, filename = null) {
  const id = Date.now() + '_' + Math.random().toString(36).slice(2, 8)
  const name = filename || `${id}.jpg`
  const savePath = path.join(uploadDir, name)

  // 使用 sharp 处理图片（自动去除EXIF、压缩、限制尺寸）
  await sharp(buffer)
    .rotate()           // 根据EXIF旋转后清除EXIF
    .resize({
      width: 1920,
      height: 1920,
      fit: 'inside',
      withoutEnlargement: true
    })
    .jpeg({ quality: 80 })
    .toFile(savePath)

  return `/uploads/${name}`
}

/**
 * 组装帖子列表项
 */
async function assemblePost(post) {
  // 获取评论数
  const [commentRows] = await dbQuery(
    'SELECT COUNT(*) as count FROM comments WHERE post_id = ? AND status = 1',
    [post.id]
  )

  // 获取图片
  const [imageRows] = await dbQuery(
    'SELECT url, sort_order FROM post_images WHERE post_id = ? ORDER BY sort_order',
    [post.id]
  )

  return {
    id: post.id,
    type: post.type,
    nickname: post.nickname,
    content: post.content,
    images: imageRows,
    image_count: post.image_count,
    comment_count: commentRows[0]?.count || 0,
    created_at: post.created_at,
    time_ago: formatTimeAgo(post.created_at)
  }
}

// ============ 路由定义 ============

/**
 * POST /api/posts - 发布帖子
 */
router.post(
  '/',
  postLimiter,
  upload.array('images', 6),
  contentAuditor,
  // 参数校验
  [
    body('type').isIn([1, 2]).withMessage('帖子类型不正确'),
    body('content').isLength({ min: 1, max: 2000 }).withMessage('内容长度需在1-2000字之间')
  ],
  async (req, res) => {
    // 校验错误
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      const messages = errors.array().map(e => e.msg).join('；')
      return error(res, 40001, messages, 400)
    }

    const { type, content } = req.body
    const files = req.files || []

    // 随手拍帖至少1张图
    if (type == 2 && files.length < 1) {
      return error(res, 40001, '随手拍帖至少需要1张图片', 400)
    }

    // 烦恼帖最多3张
    if (type == 1 && files.length > 3) {
      return error(res, 40001, '烦恼帖最多上传3张图片', 400)
    }

    const clientIP = getClientIP(req)
    const ipHash = hashIP(clientIP)
    const nickname = generateNickname()

    let connection
    try {
      // 开启事务
      connection = await dbQuery('SELECT 1').then(() => null) // mysql2/promise的pool会自动管理连接
      // 使用pool直接执行（单连接）
      const conn = await require('../db/connection').pool.getConnection()
      await conn.beginTransaction()

      try {
        // 插入帖子
        const [postResult] = await conn.query(
          `INSERT INTO posts (type, nickname, content, image_count, ip_hash)
           VALUES (?, ?, ?, ?, ?)`,
          [type, nickname, content, files.length, ipHash]
        )
        const postId = postResult.insertId

        // 处理并保存图片
        for (let i = 0; i < files.length; i++) {
          const url = await processAndSaveImage(files[i].buffer)
          await conn.query(
            `INSERT INTO post_images (post_id, url, sort_order) VALUES (?, ?, ?)`,
            [postId, url, i]
          )
        }

        await conn.commit()
        conn.release()

        return success(res, {
          id: postId,
          nickname,
          status: 1
        }, '🌱 已种下一棵小树苗')
      } catch (err) {
        await conn.rollback()
        conn.release()
        throw err
      }
    } catch (err) {
      console.error('发帖失败:', err)
      return error(res, 50001, '发布失败，请稍后重试', 500)
    }
  }
)

/**
 * GET /api/posts - 获取帖子列表
 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('页码需大于0'),
    query('size').optional().isInt({ min: 1, max: 20 }).withMessage('每页数量需在1-20之间'),
    query('type').optional().isIn([1, 2]).withMessage('类型值不正确')
  ],
  async (req, res) => {
    const page = parseInt(req.query.page) || 1
    const size = parseInt(req.query.size) || 10
    const type = req.query.type

    try {
      // 构建查询
      let countSql = 'SELECT COUNT(*) as total FROM posts WHERE status = 1'
      let querySql = 'SELECT * FROM posts WHERE status = 1'
      const params = []

      if (type) {
        countSql += ' AND type = ?'
        querySql += ' AND type = ?'
        params.push(type)
      }

      querySql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'

      // 执行查询
      const [countRows] = await dbQuery(countSql, params)
      const total = countRows[0].total

      const [postRows] = await dbQuery(querySql, [...params, size, (page - 1) * size])

      // 组装完整数据
      const list = []
      for (const post of postRows) {
        const assembled = await assemblePost(post)
        list.push(assembled)
      }

      return success(res, {
        list,
        total,
        page,
        size,
        has_more: page * size < total
      })
    } catch (err) {
      console.error('获取帖子列表失败:', err)
      return error(res, 50001, '获取帖子失败', 500)
    }
  }
)

/**
 * GET /api/posts/:id - 获取帖子详情
 */
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id)
  if (!id) {
    return error(res, 40001, '帖子ID无效', 400)
  }

  try {
    const [rows] = await dbQuery(
      'SELECT * FROM posts WHERE id = ? AND status = 1',
      [id]
    )

    if (rows.length === 0) {
      return error(res, 40401, '帖子不存在或已被删除', 404)
    }

    const post = await assemblePost(rows[0])
    return success(res, post)
  } catch (err) {
    console.error('获取帖子详情失败:', err)
    return error(res, 50001, '获取详情失败', 500)
  }
})

module.exports = router
