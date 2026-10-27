/**
 * 限流中间件
 * 使用 express-rate-limit 对敏感接口进行限流，防止刷屏
 */

const rateLimit = require('express-rate-limit')
const { getClientIP, hashIP } = require('../utils/ipHash')

/**
 * 通用限流配置
 */
const postLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10分钟
  max: 3,                    // 最多3次发帖
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = getClientIP(req)
    return hashIP(ip)
  },
  handler: (req, res) => {
    res.status(429).json({
      code: 40003,
      message: '发帖太频繁啦，休息一下吧～',
      data: null
    })
  }
})

const commentLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1分钟
  max: 10,                    // 最多10条评论
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = getClientIP(req)
    return hashIP(ip)
  },
  handler: (req, res) => {
    res.status(429).json({
      code: 40003,
      message: '评论太频繁啦～',
      data: null
    })
  }
})

const reportLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,  // 10分钟
  max: 5,                     // 最多5次举报
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = getClientIP(req)
    return hashIP(ip)
  },
  handler: (req, res) => {
    res.status(429).json({
      code: 40003,
      message: '举报太频繁啦',
      data: null
    })
  }
})

module.exports = {
  postLimiter,
  commentLimiter,
  reportLimiter
}
