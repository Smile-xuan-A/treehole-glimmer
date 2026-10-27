# 微光树洞 - 技术设计文档

> 版本：v1.0 | 更新日期：2026-10-27

---

## 一、技术选型

### 1.1 整体架构
```
┌─────────────────────────────────────────────────────────────┐
│                        用户浏览器                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           Vue3 + Vite + TailwindCSS 前端              │  │
│  │   DOMPurify(XSS防护) · exif-js(EXIF清除) · 图片压缩    │  │
│  └──────────────────────────┬────────────────────────────┘  │
│                             │ HTTP/HTTPS                    │
└─────────────────────────────┼───────────────────────────────┘
                              │
┌─────────────────────────────┼───────────────────────────────┐
│                     Node.js 后端服务                         │
│  ┌──────────────────────────┴────────────────────────────┐  │
│  │              Express.js 路由层                         │  │
│  │  helmet(安全头) · cors · express-rate-limit(限流)     │  │
│  └──────────────────────────┬────────────────────────────┘  │
│                             │                                │
│  ┌──────────────────────────┴────────────────────────────┐  │
│  │              中间件层                                  │  │
│  │  XSS清洗 · 内容审核API调用 · 随机昵称生成              │  │
│  └──────────────────────────┬────────────────────────────┘  │
│                             │                                │
│  ┌──────────────────────────┴────────────────────────────┐  │
│  │              数据层                                    │  │
│  │         MySQL (帖子/评论/举报) · 对象存储(图片)         │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 详细技术栈

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| **前端框架** | Vue 3 | 3.4+ | Composition API |
| **构建工具** | Vite | 5.0+ | 快速开发服务器 |
| **CSS框架** | TailwindCSS | 3.4+ | 原子化CSS |
| **路由** | Vue Router | 4.2+ | SPA路由管理 |
| **HTTP客户端** | Axios | 1.6+ | API请求 |
| **XSS防护** | DOMPurify | 3.0+ | 输入输出过滤 |
| **EXIF清除** | exif-js | 2.3+ | 图片GPS信息移除 |
| **图片压缩** | browser-image-compression | 2.0+ | 前端压缩 |
| **后端框架** | Express.js | 4.18+ | RESTful API |
| **数据库** | MySQL | 8.0+ | 关系型存储 |
| **ORM** | mysql2 (Promise) | 3.6+ | 异步数据库操作 |
| **安全头** | helmet | 7.1+ | HTTP安全响应头 |
| **CORS** | cors | 2.8+ | 跨域控制 |
| **限流** | express-rate-limit | 7.4+ | 接口防刷 |
| **参数校验** | express-validator | 7.0+ | 请求参数验证 |
| **对象存储** | Multer + 本地/S3 | - | 图片存储（开发环境本地，生产可切换） |
| **内容审核** | 百度智能云内容安全 | - | 文本/图片违规检测 |

---

## 二、数据库设计

### 2.1 ER图
```
┌─────────────┐     1:N     ┌─────────────┐
│   posts     │─────────────►│  comments   │
└──────┬──────┘              └─────────────┘
       │
       │ 1:N
       ▼
┌─────────────┐
│ post_images │
└─────────────┘

┌─────────────┐     多态关联     ┌─────────────┐
│   reports   │──────────────────►│ 举报目标    │
└─────────────┘                   (post/comment)
```

### 2.2 表结构设计

#### posts 帖子表
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INT | PRIMARY KEY AUTO_INCREMENT | 帖子ID |
| type | TINYINT | NOT NULL, DEFAULT 1 | 1=烦恼求助, 2=随手拍分享 |
| nickname | VARCHAR(50) | NOT NULL | 系统生成的随机昵称 |
| content | TEXT | NOT NULL | 帖子内容（烦恼帖文字/随手拍心情文案） |
| image_count | TINYINT | NOT NULL, DEFAULT 0 | 图片数量 |
| ip_hash | VARCHAR(64) | NOT NULL | IP哈希（仅用于限流，不可逆） |
| status | TINYINT | NOT NULL, DEFAULT 1 | 1=正常, 2=审核中, 3=已屏蔽 |
| report_count | INT | NOT NULL, DEFAULT 0 | 被举报次数 |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

#### post_images 帖子图片表
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INT | PRIMARY KEY AUTO_INCREMENT | 图片ID |
| post_id | INT | NOT NULL, FOREIGN KEY → posts.id | 关联帖子 |
| url | VARCHAR(500) | NOT NULL | 图片访问URL |
| sort_order | TINYINT | NOT NULL, DEFAULT 0 | 排序序号 |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 创建时间 |

#### comments 评论表
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INT | PRIMARY KEY AUTO_INCREMENT | 评论ID |
| post_id | INT | NOT NULL, FOREIGN KEY → posts.id | 关联帖子 |
| nickname | VARCHAR(50) | NOT NULL | 系统生成的随机昵称 |
| content | VARCHAR(500) | NOT NULL | 评论内容 |
| ip_hash | VARCHAR(64) | NOT NULL | IP哈希 |
| status | TINYINT | NOT NULL, DEFAULT 1 | 1=正常, 2=审核中, 3=已屏蔽 |
| report_count | INT | NOT NULL, DEFAULT 0 | 被举报次数 |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 创建时间 |

#### reports 举报表
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INT | PRIMARY KEY AUTO_INCREMENT | 举报ID |
| target_type | TINYINT | NOT NULL | 1=帖子, 2=评论 |
| target_id | INT | NOT NULL | 目标ID |
| reason | TINYINT | NOT NULL | 1=违规内容, 2=自残倾向, 3=辱骂攻击, 4=其他 |
| detail | VARCHAR(200) | NULL | 可选补充说明 |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 创建时间 |

### 2.3 索引设计
```sql
-- 帖子表
CREATE INDEX idx_posts_type_created ON posts(type, created_at DESC);
CREATE INDEX idx_posts_status ON posts(status);

-- 评论表
CREATE INDEX idx_comments_post ON comments(post_id, created_at ASC);
CREATE INDEX idx_comments_status ON comments(status);

-- 举报表
CREATE INDEX idx_reports_target ON reports(target_type, target_id);
```

### 2.4 建表SQL
```sql
CREATE DATABASE IF NOT EXISTS whisper_hole CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE whisper_hole;

-- 帖子表
CREATE TABLE posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type TINYINT NOT NULL DEFAULT 1 COMMENT '1=烦恼求助 2=随手拍分享',
    nickname VARCHAR(50) NOT NULL COMMENT '系统随机昵称',
    content TEXT NOT NULL COMMENT '帖子内容',
    image_count TINYINT NOT NULL DEFAULT 0,
    ip_hash VARCHAR(64) NOT NULL COMMENT 'IP哈希用于限流',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '1=正常 2=审核中 3=屏蔽',
    report_count INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_posts_type_created (type, created_at DESC),
    INDEX idx_posts_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 帖子图片表
CREATE TABLE post_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    url VARCHAR(500) NOT NULL,
    sort_order TINYINT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    INDEX idx_images_post (post_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 评论表
CREATE TABLE comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    nickname VARCHAR(50) NOT NULL,
    content VARCHAR(500) NOT NULL,
    ip_hash VARCHAR(64) NOT NULL,
    status TINYINT NOT NULL DEFAULT 1,
    report_count INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    INDEX idx_comments_post (post_id, created_at ASC),
    INDEX idx_comments_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 举报表
CREATE TABLE reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    target_type TINYINT NOT NULL COMMENT '1=帖子 2=评论',
    target_id INT NOT NULL,
    reason TINYINT NOT NULL COMMENT '1=违规 2=自残 3=辱骂 4=其他',
    detail VARCHAR(200) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_reports_target (target_type, target_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 三、API接口设计

### 3.1 统一响应格式
```json
// 成功响应
{
  "code": 0,
  "message": "ok",
  "data": {}
}

// 错误响应
{
  "code": 40001,
  "message": "内容包含违规信息，请修改后重试",
  "data": null
}
```

### 3.2 错误码定义
| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 40001 | 参数校验失败 |
| 40002 | 内容违规被拦截 |
| 40003 | 请求过于频繁（限流） |
| 40401 | 帖子不存在 |
| 40402 | 评论不存在 |
| 50001 | 服务器内部错误 |

### 3.3 接口列表

#### 帖子相关

| 方法 | 路径 | 说明 | 限流 |
|------|------|------|------|
| POST | /api/posts | 发布帖子 | 3次/10分钟/IP |
| GET | /api/posts | 获取帖子列表（分页） | 无严格限流 |
| GET | /api/posts/:id | 获取帖子详情 | 无严格限流 |

##### POST /api/posts 发布帖子
请求体（multipart/form-data）：
```
type: 1 (烦恼求助) | 2 (随手拍分享)
content: string (文字内容)
images: File[] (图片文件，烦恼帖0-3张，随手拍1-6张)
```
成功响应：
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": 123,
    "nickname": "温柔的月光小熊",
    "status": 1
  }
}
```

##### GET /api/posts 获取帖子列表
查询参数：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认1 |
| size | int | 否 | 每页数量，默认10，最大20 |
| type | int | 否 | 筛选类型，1=烦恼 2=随手拍，不传则全部 |

成功响应：
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "list": [
      {
        "id": 123,
        "type": 1,
        "nickname": "温柔的月光小熊",
        "content": "今天面试又失败了...",
        "images": [],
        "image_count": 0,
        "comment_count": 5,
        "created_at": "2026-10-27T10:30:00Z",
        "time_ago": "2小时前"
      }
    ],
    "total": 500,
    "page": 1,
    "size": 10,
    "has_more": true
  }
}
```

##### GET /api/posts/:id 获取帖子详情
成功响应：
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": 123,
    "type": 1,
    "nickname": "温柔的月光小熊",
    "content": "今天面试又失败了，我是不是真的很差劲...",
    "images": [
      { "url": "/uploads/xxx.jpg", "sort_order": 0 }
    ],
    "image_count": 1,
    "comment_count": 5,
    "created_at": "2026-10-27T10:30:00Z",
    "time_ago": "2小时前"
  }
}
```

#### 评论相关

| 方法 | 路径 | 说明 | 限流 |
|------|------|------|------|
| POST | /api/comments | 发表评论 | 10次/分钟/IP |
| GET | /api/comments | 获取帖子评论列表 | 无严格限流 |

##### POST /api/comments 发表评论
请求体（application/json）：
```json
{
  "post_id": 123,
  "content": "加油呀，下次会更好的！"
}
```
成功响应：
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": 456,
    "nickname": "迷路的云朵",
    "content": "加油呀，下次会更好的！",
    "created_at": "2026-10-27T12:00:00Z"
  }
}
```

##### GET /api/comments 获取评论列表
查询参数：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| post_id | int | 是 | 帖子ID |
| page | int | 否 | 页码，默认1 |
| size | int | 否 | 每页数量，默认20 |

成功响应：
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "list": [
      {
        "id": 456,
        "nickname": "迷路的云朵",
        "content": "加油呀，下次会更好的！",
        "created_at": "2026-10-27T12:00:00Z",
        "time_ago": "30分钟前"
      }
    ],
    "total": 5,
    "has_more": false
  }
}
```

#### 举报相关

| 方法 | 路径 | 说明 | 限流 |
|------|------|------|------|
| POST | /api/reports | 提交举报 | 5次/10分钟/IP |

##### POST /api/reports 提交举报
请求体（application/json）：
```json
{
  "target_type": 1,
  "target_id": 123,
  "reason": 2,
  "detail": "看起来有自残倾向"
}
```
成功响应：
```json
{
  "code": 0,
  "message": "ok",
  "data": null
}
```

---

## 四、匿名昵称生成方案

### 4.1 设计思路
从词库中随机组合「形容词 + 名词」，生成温柔治愈风格的随机昵称。

### 4.2 词库示例
```javascript
// 形容词（温柔治愈向）
const adjectives = [
  '温柔的', '迷路的', '安静的', '孤独的', '勇敢的', '柔软的',
  '闪闪发光的', '轻轻的', '悄悄的', '暖暖的', '清凉的', '甜甜的',
  '淡淡的', '悠悠的', '慢慢的', '静静的', '浅浅的', '软软的',
  '飘着的', '游荡的', '沉睡的', '醒来的', '微笑的', '发呆的'
];

// 名词（自然/治愈向）
const nouns = [
  '月光小熊', '云朵', '向日葵', '小猫咪', '流浪狗', '蒲公英',
  '萤火虫', '星星', '月亮', '小松鼠', '棉花糖', '柠檬茶',
  '雨后彩虹', '海边贝壳', '森林小鹿', '早安面包', '晚风',
  '深夜台灯', '旧书页', '毛绒毯子', '热可可', '晴天娃娃',
  '樱花', '薰衣草', '小刺猬', '大白兔', '绿豆冰沙'
];

// 生成函数
function generateNickname() {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return adj + noun;
}
```

### 4.3 唯一性保障
- 昵称重复概率极低（24 × 25 = 600种组合）
- 数据库不强制唯一，即使重复也不影响匿名性
- 如担心重复，可拼接3位随机数：`温柔的月光小熊233`

---

## 五、安全方案

### 5.1 XSS防护
```
前端：DOMPurify.sanitize(userInput) 渲染前过滤
后端：express-validator + 输出时转义
双重保障，不信任任何用户输入
```

### 5.2 EXIF清除
```
前端上传前：exif-js 读取并删除 GPS、Camera 等敏感字段
后端兜底：sharp 重新编码图片去除元数据
```

### 5.3 内容审核
```
方案：百度智能云内容安全 API
- 文本审核：检测辱骂、敏感词、自残引导
- 图片审核：检测涉黄、涉暴、二维码
接入方式：后端调用审核API，失败则返回友好提示
降级策略：审核API不可用时进入"待审核"状态而非直接放行
```

### 5.4 限流策略
```javascript
// 帖子发布限流
const postLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,  // 10分钟
  max: 3,                     // 最多3次
  message: { code: 40003, message: '发帖太频繁啦，休息一下吧～' },
  standardHeaders: true,
  legacyHeaders: false,
  // 使用IP哈希作为key
  keyGenerator: (req) => hashIP(req.ip)
});

// 评论限流
const commentLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1分钟
  max: 10,                     // 最多10次
  message: { code: 40003, message: '评论太频繁啦～' }
});
```

### 5.5 IP哈希方案
```javascript
// 使用 SHA-256 对IP加盐哈希，不可逆但可用于限流
const crypto = require('crypto');
function hashIP(ip) {
  const salt = process.env.IP_SALT || 'whisper-hole-secret';
  return crypto.createHash('sha256').update(ip + salt).digest('hex');
}
```

---

## 六、前端设计规范

### 6.1 设计Token（CSS变量）

#### 浅色主题
```css
:root {
  /* 主色调 - 治愈紫粉 */
  --color-primary: #b39ddb;          /* 柔和薰衣草紫 */
  --color-primary-light: #d1c4e9;
  --color-primary-dark: #9575cd;
  
  /* 辅助色 - 天空蓝/奶油橙 */
  --color-secondary: #90caf9;        /* 天空蓝 */
  --color-accent: #ffcc80;           /* 奶油橙 */
  
  /* 语义色 */
  --color-rain: #81d4fa;             /* 烦恼帖 - 雨天蓝 */
  --color-sun: #ffd54f;              /* 随手拍 - 晴天黄 */
  
  /* 背景 */
  --bg-page: #faf8fc;                /* 薰衣草白 */
  --bg-card: rgba(255, 255, 255, 0.7); /* 毛玻璃白 */
  --bg-glass: rgba(255, 255, 255, 0.5);
  
  /* 文字 */
  --text-primary: #37474f;
  --text-secondary: #78909c;
  --text-muted: #b0bec5;
  
  /* 边框/分割线 */
  --border-light: rgba(179, 157, 219, 0.2);
  
  /* 圆角 */
  --radius-sm: 8px;
  --radius-md: 16px;
  --radius-lg: 24px;
  --radius-xl: 32px;
  
  /* 阴影 */
  --shadow-soft: 0 4px 20px rgba(179, 157, 219, 0.15);
  --shadow-card: 0 8px 32px rgba(179, 157, 219, 0.12);
  
  /* 动画时长 */
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;
}
```

#### 深色主题
```css
[data-theme="dark"] {
  --color-primary: #9575cd;
  --color-primary-light: #7e57c2;
  --color-primary-dark: #b39ddb;
  
  --color-secondary: #64b5f6;
  --color-accent: #ffb74d;
  
  --color-rain: #4fc3f7;
  --color-sun: #ffca28;
  
  --bg-page: #1a1a2e;                /* 深夜蓝 */
  --bg-card: rgba(42, 42, 60, 0.7);
  --bg-glass: rgba(42, 42, 60, 0.5);
  
  --text-primary: #eceff1;
  --text-secondary: #b0bec5;
  --text-muted: #78909c;
  
  --border-light: rgba(149, 117, 205, 0.3);
  
  --shadow-soft: 0 4px 20px rgba(0, 0, 0, 0.3);
  --shadow-card: 0 8px 32px rgba(0, 0, 0, 0.4);
}
```

### 6.2 毛玻璃效果
```css
.glass-card {
  background: var(--bg-card);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
}
```

### 6.3 淡入动画
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in-up {
  animation: fadeInUp var(--duration-slow) ease-out forwards;
}
```

---

## 七、项目目录结构

### 7.1 前端
```
whisper-hole/
├── frontend/
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── api/                    # API请求封装
│   │   │   └── index.js
│   │   ├── assets/                 # 静态资源
│   │   │   └── styles/
│   │   │       ├── main.css        # 主样式+主题变量
│   │   │       └── animations.css  # 动画定义
│   │   ├── components/             # 公共组件
│   │   │   ├── GlassCard.vue       # 毛玻璃卡片
│   │   │   ├── RiskNotice.vue      # 风险提示组件
│   │   │   ├── ThemeToggle.vue     # 主题切换按钮
│   │   │   ├── PostCard.vue        # 帖子卡片
│   │   │   ├── CommentItem.vue     # 评论项
│   │   │   ├── ImagePreview.vue    # 图片预览
│   │   │   ├── ReportModal.vue     # 举报弹窗
│   │   │   └── FloatingButton.vue  # 悬浮发帖按钮
│   │   ├── views/                  # 页面
│   │   │   ├── HomePage.vue        # 首页信息流
│   │   │   ├── CreatePost.vue      # 发帖页
│   │   │   └── PostDetail.vue      # 帖子详情
│   │   ├── composables/            # 组合式函数
│   │   │   ├── useTheme.js         # 主题管理
│   │   │   └── useImageUtils.js    # 图片工具(压缩/EXIF)
│   │   ├── router/
│   │   │   └── index.js
│   │   ├── App.vue
│   │   └── main.js
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
```

### 7.2 后端
```
whisper-hole/
├── backend/
│   ├── src/
│   │   ├── routes/                 # 路由
│   │   │   ├── posts.js
│   │   │   ├── comments.js
│   │   │   └── reports.js
│   │   ├── middleware/             # 中间件
│   │   │   ├── security.js         # helmet/cors/XSS清洗
│   │   │   ├── rateLimiter.js      # 限流配置
│   │   │   ├── audit.js            # 内容审核
│   │   │   └── errorHandler.js     # 错误处理
│   │   ├── utils/                  # 工具函数
│   │   │   ├── nickname.js         # 随机昵称生成
│   │   │   ├── ipHash.js           # IP哈希
│   │   │   ├── timeFormat.js       # 时间格式化
│   │   │   └── exifCleaner.js      # EXIF清除(sharp)
│   │   ├── db/
│   │   │   ├── connection.js       # 数据库连接
│   │   │   └── schema.sql          # 建表SQL
│   │   ├── uploads/                # 图片存储目录
│   │   └── app.js                  # 入口文件
│   ├── .env.example
│   └── package.json
```

---

## 八、部署建议

### 8.1 开发环境
```bash
# 前端开发
cd frontend
npm install
npm run dev      # http://localhost:5173

# 后端开发
cd backend
npm install
npm run dev      # http://localhost:3000
```

### 8.2 生产环境
```bash
# 前端构建
cd frontend
npm run build    # 输出到 dist/

# 后端部署
cd backend
npm run build    # 如有TypeScript
npm start        # PM2 守护进程
```

### 8.3 Nginx 配置要点
- 前端静态资源托管
- 反向代理后端API /api/*
- 图片目录 /uploads/ 单独配置
- HTTPS 证书配置
