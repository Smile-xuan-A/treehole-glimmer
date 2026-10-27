/**
 * 内容审核中间件
 * 开发环境使用本地关键词过滤
 * 生产环境可接入百度/阿里智能云内容安全API
 */

require('dotenv').config()

// 敏感词库（示例，生产环境应接入专业审核API）
const sensitiveKeywords = [
  // 自残/自杀引导
  '自杀', '轻生', '自残', '割腕', '跳楼', '不想活', '活不下去',
  '去死', '死掉', '结束生命', '自杀方法',
  // 极端暴力
  '杀人', '砍人', '爆炸', '恐怖袭击',
  // 色情
  '约炮', '一夜情', '裸聊',
  // 辱骂（部分）
  '傻逼', 'fuck', 'shit'
]

/**
 * 检查文本是否包含敏感内容
 * @param {string} text - 待检查文本
 * @returns {{ passed: boolean, matched: string[] }}
 */
function checkText(text) {
  if (!text || typeof text !== 'string') {
    return { passed: true, matched: [] }
  }

  const lowerText = text.toLowerCase()
  const matched = []

  for (const keyword of sensitiveKeywords) {
    if (lowerText.includes(keyword.toLowerCase())) {
      matched.push(keyword)
    }
  }

  return {
    passed: matched.length === 0,
    matched
  }
}

/**
 * 内容审核中间件
 * 检查 req.body.content 和 req.body.detail
 */
function contentAuditor(req, res, next) {
  const content = req.body?.content || ''
  const detail = req.body?.detail || ''

  // 检查主内容
  const contentCheck = checkText(content)
  if (!contentCheck.passed) {
    return res.status(400).json({
      code: 40002,
      message: '内容可能包含敏感信息，请修改后重试',
      data: { matched: contentCheck.matched }
    })
  }

  // 检查举报详情
  if (detail) {
    const detailCheck = checkText(detail)
    if (!detailCheck.passed) {
      return res.status(400).json({
        code: 40002,
        message: '描述中包含不当词汇',
        data: null
      })
    }
  }

  next()
}

/**
 * 异步内容审核（预留接入外部API的接口）
 * 开发环境同步检查即可
 */
async function asyncAudit(text) {
  // 如果配置了百度API，调用百度内容安全
  if (process.env.BAIDU_API_KEY && process.env.BAIDU_SECRET_KEY) {
    try {
      // TODO: 接入百度智能云内容安全API
      // const result = await callBaiduAudit(text)
      // return result
    } catch (err) {
      console.warn('⚠️ 外部审核API调用失败，降级为本地检查')
    }
  }

  // 降级：本地关键词检查
  return checkText(text)
}

module.exports = {
  contentAuditor,
  checkText,
  asyncAudit
}
