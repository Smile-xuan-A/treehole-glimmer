/**
 * IP地址哈希工具
 * 使用 SHA-256 对IP加盐哈希，不可逆但可用于限流、去重
 */

const crypto = require('crypto')
require('dotenv').config()

const SALT = process.env.IP_SALT || 'whisper-hole-secret-default'

/**
 * 哈希IP地址
 * @param {string} ip - IP地址
 * @returns {string} SHA-256 十六进制哈希
 */
function hashIP(ip) {
  if (!ip) return ''

  // 处理 ::1 或 ::ffff:127.0.0.1 格式
  let cleanIP = ip
  if (ip.startsWith('::ffff:')) {
    cleanIP = ip.substring(7)
  } else if (ip === '::1') {
    cleanIP = '127.0.0.1'
  }

  return crypto
    .createHash('sha256')
    .update(cleanIP + ':' + SALT)
    .digest('hex')
}

/**
 * 从请求中获取客户端真实IP
 * @param {object} req - Express request
 * @returns {string}
 */
function getClientIP(req) {
  // 优先使用反向代理头
  const forwarded = req.headers['x-forwarded-for']
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIP = req.headers['x-real-ip']
  if (realIP) return realIP

  return req.ip || req.connection?.remoteAddress || '127.0.0.1'
}

module.exports = {
  hashIP,
  getClientIP
}
