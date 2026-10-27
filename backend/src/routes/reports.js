/**
 * 举报相关路由
 * POST /api/reports - 提交举报
 */

const express = require('express')
const { body, validationResult } = require('express-validator')

const router = express.Router()
const { query: dbQuery } = require('../db/connection')
const { success, error } = require('../middleware/errorHandler')
const { reportLimiter } = require('../middleware/rateLimiter')
const { contentAuditor } = require('../middleware/audit')

/**
 * POST /api/reports - 提交举报
 */
router.post(
  '/',
  reportLimiter,
  contentAuditor,
  [
    body('target_type').isIn([1, 2]).withMessage('目标类型无效'),
    body('target_id').isInt({ min: 1 }).withMessage('目标ID无效'),
    body('reason').isIn([1, 2, 3, 4]).withMessage('举报原因无效'),
    body('detail').optional().isLength({ max: 200 }).withMessage('补充说明不超过200字')
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      const messages = errors.array().map(e => e.msg).join('；')
      return error(res, 40001, messages, 400)
    }

    const { target_type, target_id, reason, detail } = req.body

    try {
      // 检查目标是否存在
      let targetTable = target_type === 1 ? 'posts' : 'comments'
      const [targetRows] = await dbQuery(
        `SELECT id, report_count FROM ${targetTable} WHERE id = ?`,
        [target_id]
      )

      if (targetRows.length === 0) {
        return error(res, 40401, '目标内容不存在', 404)
      }

      // 插入举报记录
      await dbQuery(
        `INSERT INTO reports (target_type, target_id, reason, detail)
         VALUES (?, ?, ?, ?)`,
        [target_type, target_id, reason, detail || null]
      )

      // 更新目标的举报计数
      const [updatedRows] = await dbQuery(
        `UPDATE ${targetTable} SET report_count = report_count + 1 WHERE id = ?`,
        [target_id]
      )

      // 如果举报次数达到3次，自动标记为待审核
      const currentCount = (targetRows[0].report_count || 0) + 1
      if (currentCount >= 3) {
        await dbQuery(
          `UPDATE ${targetTable} SET status = 2 WHERE id = ? AND status = 1`,
          [target_id]
        )
        console.log(`⚠️ 目标 ${target_type}:${target_id} 被举报${currentCount}次，已标记待审核`)
      }

      return success(res, null, '🙏 感谢你的反馈')
    } catch (err) {
      console.error('举报失败:', err)
      return error(res, 50001, '提交失败，请稍后重试', 500)
    }
  }
)

module.exports = router
