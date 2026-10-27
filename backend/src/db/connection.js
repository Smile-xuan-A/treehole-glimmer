/**
 * 数据库连接池
 * 使用 mysql2/promise 实现异步数据库操作
 */

const mysql = require('mysql2/promise')
require('dotenv').config()

// 读取配置（优先从环境变量，开发环境有默认值）
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'whisper_hole',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  multipleStatements: true // 允许执行多条SQL（初始化用）
}

// 创建连接池
const pool = mysql.createPool(config)

/**
 * 初始化数据库和表
 * 如果数据库不存在则自动创建
 */
async function initDatabase() {
  try {
    // 先连接MySQL服务器（不指定数据库）
    const initPool = mysql.createPool({
      ...config,
      database: undefined
    })

    // 创建数据库
    await initPool.query(`
      CREATE DATABASE IF NOT EXISTS ${config.database}
      CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `)
    console.log('✅ 数据库已准备好')

    await initPool.end()

    // 使用主连接池创建表
    await createTables()
    console.log('✅ 数据表已准备好')
  } catch (err) {
    console.error('❌ 数据库初始化失败:', err.message)
    // 开发环境允许继续运行（使用Mock模式）
    if (process.env.NODE_ENV === 'development') {
      console.log('ℹ️ 开发环境：后端将以 Mock 模式运行')
    }
  }
}

// 建表SQL
const createTables = async () => {
  const createPosts = `
    CREATE TABLE IF NOT EXISTS posts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      type TINYINT NOT NULL DEFAULT 1 COMMENT '1=烦恼求助 2=随手拍分享',
      nickname VARCHAR(50) NOT NULL,
      content TEXT NOT NULL,
      image_count TINYINT NOT NULL DEFAULT 0,
      ip_hash VARCHAR(64) NOT NULL,
      status TINYINT NOT NULL DEFAULT 1 COMMENT '1=正常 2=审核中 3=屏蔽',
      report_count INT NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_posts_type_created (type, created_at DESC),
      INDEX idx_posts_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `

  const createImages = `
    CREATE TABLE IF NOT EXISTS post_images (
      id INT AUTO_INCREMENT PRIMARY KEY,
      post_id INT NOT NULL,
      url VARCHAR(500) NOT NULL,
      sort_order TINYINT NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      INDEX idx_images_post (post_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `

  const createComments = `
    CREATE TABLE IF NOT EXISTS comments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      post_id INT NOT NULL,
      nickname VARCHAR(50) NOT NULL,
      content VARCHAR(500) NOT NULL,
      ip_hash VARCHAR(64) NOT NULL,
      status TINYINT NOT NULL DEFAULT 1,
      report_count INT NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      INDEX idx_comments_post (post_id, created_at ASC)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `

  const createReports = `
    CREATE TABLE IF NOT EXISTS reports (
      id INT AUTO_INCREMENT PRIMARY KEY,
      target_type TINYINT NOT NULL,
      target_id INT NOT NULL,
      reason TINYINT NOT NULL,
      detail VARCHAR(200) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_reports_target (target_type, target_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `

  await pool.query(createPosts)
  await pool.query(createImages)
  await pool.query(createComments)
  await pool.query(createReports)
}

module.exports = {
  pool,
  query: (sql, params) => pool.query(sql, params),
  initDatabase
}
