/**
 * 微光树洞 - 后端服务入口
 * Express + MySQL + 安全中间件
 */

require('dotenv').config()
const express = require('express')
const path = require('path')
const fs = require('fs')

const { securityMiddleware } = require('./middleware/security')
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler')
const { initDatabase } = require('./db/connection')

// ============ 导入路由 ============
const postsRouter = require('./routes/posts')
const commentsRouter = require('./routes/comments')
const reportsRouter = require('./routes/reports')

// ============ 创建应用 ============
const app = express()
const PORT = parseInt(process.env.PORT) || 3000

// ============ 中间件 ============
// 安全中间件（helmet、cors、XSS清洗）
app.use(securityMiddleware)

// JSON body解析
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// ============ 静态资源 ============
// 图片上传目录
const uploadDir = path.join(__dirname, '../uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}
app.use('/uploads', express.static(uploadDir))

// ============ 路由注册 ============
app.use('/api/posts', postsRouter)
app.use('/api/comments', commentsRouter)
app.use('/api/reports', reportsRouter)

// ============ 健康检查 ============
app.get('/api/health', (req, res) => {
  res.json({
    code: 0,
    message: 'ok',
    data: {
      service: 'whisper-hole-api',
      version: '1.0.0',
      status: 'running',
      timestamp: new Date().toISOString()
    }
  })
})

// ============ 错误处理 ============
// 404
app.use(notFoundHandler)
// 全局错误
app.use(errorHandler)

// ============ 启动服务 ============
async function start() {
  console.log('🌳 微光树洞 后端服务启动中...')
  console.log('='.repeat(50))

  // 初始化数据库
  await initDatabase()

  // 启动HTTP服务
  app.listen(PORT, () => {
    console.log(`✅ 服务已启动: http://localhost:${PORT}`)
    console.log(`📁 图片目录: ${uploadDir}`)
    console.log(`🔧 环境: ${process.env.NODE_ENV || 'development'}`)
    console.log('='.repeat(50))
    console.log('💡 温馨提示：')
    console.log('   本服务为匿名情绪互助社区，')
    console.log('   不提供专业心理诊疗服务。')
    console.log('   如遇紧急情况请拨打心理援助热线。')
  })
}

start().catch((err) => {
  console.error('❌ 服务启动失败:', err)
  process.exit(1)
})

module.exports = app
