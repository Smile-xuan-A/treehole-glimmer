/**
 * 全局错误处理中间件
 */

/**
 * 统一响应格式
 */
function success(res, data = null, message = 'ok') {
  return res.json({
    code: 0,
    message,
    data
  })
}

function error(res, code, message, status = 400, data = null) {
  return res.status(status).json({
    code,
    message,
    data
  })
}

/**
 * Express错误处理中间件
 */
function errorHandler(err, req, res, next) {
  console.error('❌ [Error]', err.message)

  // Multer文件上传错误
  if (err.code === 'LIMIT_FILE_SIZE') {
    return error(res, 40001, '图片文件太大了，单张不能超过5MB', 400)
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return error(res, 40001, '上传的图片太多了', 400)
  }

  // 数据库错误
  if (err.code && err.code.startsWith('ER_')) {
    console.error('  数据库错误:', err.code, err.message)
    return error(res, 50001, '服务器暂时开小差了，请稍后重试', 500)
  }

  // 默认错误
  const status = err.status || 500
  const code = err.code || 50001
  const message = process.env.NODE_ENV === 'production'
    ? '服务器内部错误'
    : err.message || '未知错误'

  return error(res, code, message, status)
}

/**
 * 404处理
 */
function notFoundHandler(req, res) {
  return error(res, 40401, '接口不存在', 404)
}

module.exports = {
  errorHandler,
  notFoundHandler,
  success,
  error
}
