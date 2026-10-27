/**
 * 安全中间件
 * - helmet: HTTP安全响应头
 * - cors: 跨域控制
 * - XSS清洗: 对请求体中的字符串字段进行转义
 */

const helmet = require('helmet')
const cors = require('cors')
const createDOMPurify = require('dompurify')
const { JSDOM } = require('jsdom')

// 初始化DOMPurify（Node.js环境）
const window = new JSDOM('').window
const DOMPurify = createDOMPurify(window)

/**
 * XSS清洗：递归清洗对象中所有字符串字段
 * @param {any} obj - 要清洗的对象
 * @returns {any}
 */
function sanitizeObject(obj) {
  if (obj === null || obj === undefined) return obj

  if (typeof obj === 'string') {
    return DOMPurify.sanitize(obj, {
      ALLOWED_TAGS: [], // 不允许任何HTML标签
      ALLOWED_ATTR: [],
      FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'link', 'style']
    }).trim()
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject)
  }

  if (typeof obj === 'object') {
    const result = {}
    for (const key of Object.keys(obj)) {
      result[key] = sanitizeObject(obj[key])
    }
    return result
  }

  return obj
}

/**
 * XSS清洗中间件
 */
function xssSanitizer(req, res, next) {
  if (req.body) {
    req.body = sanitizeObject(req.body)
  }
  if (req.query) {
    req.query = sanitizeObject(req.query)
  }
  next()
}

/**
 * 安全中间件组合
 */
const securityMiddleware = [
  // Helmet安全头
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'default-src': ["'self'"],
        'img-src': ["'self'", 'data:', 'https:', 'http:'],
        'style-src': ["'self'", "'unsafe-inline'"],
        'script-src': ["'self'"],
        'connect-src': ["'self'", 'http://localhost:*', 'https://*']
      }
    },
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }),

  // CORS（开发环境允许所有来源，生产环境限制）
  cors({
    origin: process.env.NODE_ENV === 'production'
      ? ['https://yourdomain.com']
      : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }),

  // XSS清洗
  xssSanitizer
]

module.exports = {
  securityMiddleware,
  xssSanitizer,
  sanitizeObject,
  DOMPurify
}
