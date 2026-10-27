/**
 * 时间格式化工具
 * 将时间戳格式化为「刚刚」「X分钟前」「X小时前」等相对时间
 */

/**
 * 格式化相对时间
 * @param {Date|string|number} time - 时间
 * @returns {string}
 */
function formatTimeAgo(time) {
  const date = new Date(time)
  const now = new Date()
  const diff = now - date

  if (diff < 0) return '刚刚'
  if (diff < 60 * 1000) return '刚刚'
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(diff / 86400000)}天前`

  // 超过7天显示具体日期
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 格式化时间为ISO字符串（用于数据库存储）
 * @param {Date} date
 * @returns {string}
 */
function formatISO(date = new Date()) {
  return date.toISOString()
}

module.exports = {
  formatTimeAgo,
  formatISO
}
