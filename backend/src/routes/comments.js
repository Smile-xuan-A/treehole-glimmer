/**
 * 评论相关路由
 * POST /api/comments      - 发表评论
 * GET  /api/comments      - 获取评论列表
 */

const express = require('express')
const { body, validationResult, query } = require('express-validator')

const router = express.Router()
const { query: dbQuery } = require('../db/connection')
const { success, error } = require('../middleware/errorHandler')
const { commentLimiter } = require('../middleware/rateLimiter')
const { contentAuditor } = require('../middleware/audit')
const { generateNickname } = require('../utils/nickname')
const { getClientIP, hashIP } = require('../utils/ipHash')
const { formatTimeAgo } = require('../utils/timeFormat')

/**
 * POST /api/comments - 发表评论
 */
router.post(
  '/',
  commentLimiter,
  contentAuditor,
  [
    body('post_id').isInt({ min: 1 }).withMessage('帖子ID无效'),
    body('content').isLength({ min: 1, max: 500 }).withMessage('评论内容需在1-500字之间')
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      const messages = errors.array().map(e => e.msg).join('；')
      return error(res, 40001, messages, 400)
    }

    const { post_id, content } = req.body

    try {
      // 检查帖子是否存在
      const [postRows] = await dbQuery(
        'SELECT id FROM posts WHERE id = ? AND status = 1',
        [post_id]
      )
      if (postRows.length === 0) {
        return error(res, 40401, '帖子不存在或已被删除', 404)
      }

      // 生成昵称和IP哈希
      const nickname = generateNickname()
      const clientIP = getClientIP(req)
      const ipHash = hashIP(clientIP)

      // 插入评论
      const [result] = await dbQuery(
        `INSERT INTO comments (post_id, nickname, content, ip_hash)
         VALUES (?, ?, ?, ?)`,
        [post_id, nickname, content, ipHash]
      )

      // 查询刚插入的评论
      const [commentRows] = await dbQuery(
        'SELECT * FROM comments WHERE id = ?',
        [result.insertId]
      )

      const comment = commentRows[0]

      return success(res, {
        id: comment.id,
        nickname: comment.nickname,
        content: comment.content,
        created_at: comment.created_at,
        time_ago: formatTimeAgo(comment.created_at)
      }, '💌 已送达温暖回应')
    } catch (err) {
      console.error('发表评论失败:', err)
      return error(res, 50001, '发送失败，请稍后重试', 500)
    }
  }
)

/**
 * GET /api/comments - 获取评论列表
 */
router.get(
  '/',
  [
    query('post_id').isInt({ min: 1 }).withMessage('帖子ID无效'),
    query('page').optional().isInt({ min: 1 }).withMessage('页码需大于0'),
    query('size').optional().isInt({ min: 1, max: 50 }).withMessage('每页数量需在1-50之间')
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      const messages = errors.array().map(e => e.msg).join('；')
      return error(res, 40001, messages, 400)
    }

    const postId = parseInt(req.query.post_id)
    const page = parseInt(req.query.page) || 1
    const size = parseInt(req.query.size) || 20

    try {
      // 总数
      const [countRows] = await dbQuery(
        'SELECT COUNT(*) as total FROM comments WHERE post_id = ? AND status = 1',
        [postId]
      )
      const total = countRows[0].total

      // 列表
      const [rows] = await dbQuery(
        `SELECT id, nickname, content, created_at
         FROM comments
         WHERE post_id = ? AND status = 1
         ORDER BY created_at ASC
         LIMIT ? OFFSET ?`,
        [postId, size, (page - 1) * size]
      )

      const list = rows.map(row => ({
        ...row,
        time_ago: formatTimeAgo(row.created_at)
      }))

      return success(res, {
        list,
        total,
        has_more: page * size < total
      })
    } catch (err) {
      console.error('获取评论失败:', err)
      return error(res, 50001, '获取评论失败', 500)
    }
  }
)

module.exports = router
