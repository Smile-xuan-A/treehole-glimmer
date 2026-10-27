/**
 * 微光树洞 - Word 文档生成脚本
 * 将 PRD 和 技术设计文档 转换为 .docx 格式
 * 
 * 运行: node scripts/generate-docs.js
 */

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle,
  WidthType, ShadingType, PageNumber, LevelFormat
} = require('docx')

const fs = require('fs')
const path = require('path')

// ============ 字体配置（中文支持） ============
const CJK_FONT = 'Microsoft YaHei'
const LATIN_FONT = 'Arial'

// 基础 run 样式
function baseRun(text, opts = {}) {
  return new TextRun({
    text,
    font: { ascii: LATIN_FONT, hAnsi: LATIN_FONT, eastAsia: CJK_FONT },
    size: 22, // 11pt
    ...opts
  })
}

// 标题 run
function headingRun(text, level = 1) {
  const sizes = { 1: 36, 2: 30, 3: 26, 4: 24 }
  return new TextRun({
    text,
    font: { ascii: LATIN_FONT, hAnsi: LATIN_FONT, eastAsia: CJK_FONT },
    size: sizes[level] || 26,
    bold: true,
    color: level === 1 ? '5E35B1' : level === 2 ? '7E57C2' : '9575CD'
  })
}

// 表格单元格通用边框
const cellBorder = {
  top: { style: BorderStyle.SINGLE, size: 1, color: 'E0E0E0' },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E0E0E0' },
  left: { style: BorderStyle.SINGLE, size: 1, color: 'E0E0E0' },
  right: { style: BorderStyle.SINGLE, size: 1, color: 'E0E0E0' }
}

// 创建表格
function makeTable(headers, rows, colWidths) {
  const border = {
    top: { style: BorderStyle.SINGLE, size: 1, color: 'BDBDBD' },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: 'BDBDBD' },
    left: { style: BorderStyle.SINGLE, size: 1, color: 'BDBDBD' },
    right: { style: BorderStyle.SINGLE, size: 1, color: 'BDBDBD' },
    insideH: { style: BorderStyle.SINGLE, size: 1, color: 'E0E0E0' },
    insideV: { style: BorderStyle.SINGLE, size: 1, color: 'E0E0E0' }
  }

  // 表头行
  const headerRow = new TableRow({
    cantSplit: true,
    children: headers.map((h, i) => new TableCell({
      borders: cellBorder,
      width: { size: colWidths[i], type: WidthType.DXA },
      shading: { fill: 'EDE7F6', type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({
        children: [new TextRun({
          text: h,
          font: { ascii: LATIN_FONT, hAnsi: LATIN_FONT, eastAsia: CJK_FONT },
          size: 20,
          bold: true,
          color: '5E35B1'
        })]
      })]
    }))
  })

  // 数据行
  const dataRows = rows.map(row => new TableRow({
    cantSplit: true,
    children: row.map((cell, i) => new TableCell({
      borders: cellBorder,
      width: { size: colWidths[i], type: WidthType.DXA },
      margins: { top: 60, bottom: 60, left: 120, right: 120 },
      children: [new Paragraph({
        children: [new TextRun({
          text: String(cell),
          font: { ascii: LATIN_FONT, hAnsi: LATIN_FONT, eastAsia: CJK_FONT },
          size: 20
        })]
      })]
    }))
  }))

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: colWidths,
    rows: [headerRow, ...dataRows]
  })
}

// 段落间距
function spacing(before = 120, after = 120) {
  return { before, after, line: 360 }
}

// ============ 文档样式配置 ============
const docStyles = {
  default: {
    document: {
      run: {
        font: { ascii: LATIN_FONT, hAnsi: LATIN_FONT, eastAsia: CJK_FONT },
        size: 22
      }
    }
  },
  paragraphStyles: [
    {
      id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
      run: {
        size: 36, bold: true, color: '5E35B1',
        font: { ascii: LATIN_FONT, hAnsi: LATIN_FONT, eastAsia: CJK_FONT }
      },
      paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0, keepNext: false, keepLines: false }
    },
    {
      id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
      run: {
        size: 30, bold: true, color: '7E57C2',
        font: { ascii: LATIN_FONT, hAnsi: LATIN_FONT, eastAsia: CJK_FONT }
      },
      paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1, keepNext: false, keepLines: false }
    },
    {
      id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
      run: {
        size: 26, bold: true, color: '9575CD',
        font: { ascii: LATIN_FONT, hAnsi: LATIN_FONT, eastAsia: CJK_FONT }
      },
      paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2, keepNext: false, keepLines: false }
    }
  ]
}

// 页眉页脚通用
function makeHeader(title) {
  return new Header({
    children: [new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({
        text: title,
        font: { ascii: LATIN_FONT, hAnsi: LATIN_FONT, eastAsia: CJK_FONT },
        size: 18,
        color: '9E9E9E',
        italics: true
      })]
    })]
  })
}

function makeFooter() {
  return new Footer({
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: '微光树洞 · 第 ',
          font: { ascii: LATIN_FONT, hAnsi: LATIN_FONT, eastAsia: CJK_FONT },
          size: 18,
          color: '9E9E9E'
        }),
        new TextRun({ children: [PageNumber.CURRENT], size: 18, color: '9E9E9E' }),
        new TextRun({
          text: ' 页 / 共 ',
          font: { ascii: LATIN_FONT, hAnsi: LATIN_FONT, eastAsia: CJK_FONT },
          size: 18,
          color: '9E9E9E'
        }),
        new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: '9E9E9E' }),
        new TextRun({
          text: ' 页',
          font: { ascii: LATIN_FONT, hAnsi: LATIN_FONT, eastAsia: CJK_FONT },
          size: 18,
          color: '9E9E9E'
        })
      ]
    })]
  })
}

// ============ 生成 PRD ============
async function generatePRD() {
  const children = []

  // 封面标题
  children.push(new Paragraph({ spacing: { before: 2000 } }))
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({
      text: '微光树洞',
      font: { ascii: LATIN_FONT, hAnsi: LATIN_FONT, eastAsia: CJK_FONT },
      size: 72, bold: true, color: '5E35B1'
    })]
  }))
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
    children: [new TextRun({
      text: '产品需求文档（PRD）',
      font: { ascii: LATIN_FONT, hAnsi: LATIN_FONT, eastAsia: CJK_FONT },
      size: 40, bold: true, color: '7E57C2'
    })]
  }))
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({
      text: '版本：v1.0    更新日期：2026-10-27',
      font: { ascii: LATIN_FONT, hAnsi: LATIN_FONT, eastAsia: CJK_FONT },
      size: 22, color: '9E9E9E'
    })]
  }))
  children.push(new Paragraph({ spacing: { before: 600 } }))

  // ==================== 一、产品定位 ====================
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [headingRun('一、产品定位')] }))

  children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [headingRun('1.1 核心定义', 2)] }))
  children.push(new Paragraph({
    spacing: spacing(60, 120),
    children: [baseRun('「微光树洞」是一个匿名情绪互助社区网站，为处于情绪低谷的用户提供温柔、低压力的倾诉空间。陌生人之间通过匿名发帖和评论互相安慰、传递温暖。')]
  }))

  children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [headingRun('1.2 产品愿景', 2)] }))
  children.push(new Paragraph({
    spacing: spacing(60, 120),
    children: [new TextRun({
      text: '让每一个孤独的夜晚，都有人对你说一声：「我懂你」。',
      font: { ascii: LATIN_FONT, hAnsi: LATIN_FONT, eastAsia: CJK_FONT },
      size: 22, italics: true, color: '7E57C2'
    })]
  }))

  children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [headingRun('1.3 核心原则（不可违背）', 2)] }))
  children.push(makeTable(
    ['原则', '说明'],
    [
      ['强匿名第一', '全程无注册、无登录、无手机号、无账号体系。用户昵称由系统随机生成（如「温柔的月光小熊」），不可自定义'],
      ['氛围温柔低压力', '低饱和度配色、舒缓交互、宽松排版；禁止内卷、流量、博眼球设计'],
      ['非医疗定位', '绝对不宣称是心理咨询平台，所有页面必须包含风险提示和心理援助热线']
    ],
    [2200, 6826]
  ))

  children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [headingRun('1.4 目标用户', 2)] }))
  children.push(new Paragraph({ spacing: spacing(60, 60), children: [baseRun('• 处于学业/工作/情感低谷的年轻人（18-30岁为主）')] }))
  children.push(new Paragraph({ spacing: spacing(0, 60), children: [baseRun('• 有倾诉需求但不愿公开表达的内向用户')] }))
  children.push(new Paragraph({ spacing: spacing(0, 120), children: [baseRun('• 希望在匿名环境下获得陌生人安慰的用户')] }))

  children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [headingRun('1.5 与竞品的差异化', 2)] }))
  children.push(makeTable(
    ['维度', '微光树洞', '其他社交平台'],
    [
      ['匿名程度', '完全匿名，无法追溯', '半匿名/实名'],
      ['核心功能', '倾诉+安慰', '社交互动+内容消费'],
      ['氛围', '温柔治愈、低压力', '流量竞争、注意力经济'],
      ['风险提示', '全站强制显示', '通常无'],
      ['互动方式', '仅评论', '点赞/收藏/关注/私信']
    ],
    [1800, 3100, 4126]
  ))

  // ==================== 二、信息架构 ====================
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [headingRun('二、信息架构')] }))

  children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [headingRun('2.1 内容类型区分', 2)] }))
  children.push(new Paragraph({
    spacing: spacing(60, 120),
    children: [baseRun('平台内容分为两类，在信息流中明确区分展示：')]
  }))
  children.push(makeTable(
    ['类型', '标识', '说明', '示例'],
    [
      ['烦恼求助帖', '🌧️ 雨天', '文字为主，可选配图，用来倾诉困惑、寻求安慰', '「今天面试又失败了，我是不是真的很差劲…」'],
      ['随手拍分享帖', '☀️ 晴天', '图片为主，可附简短心情文案，分享生活碎片传递温暖', '「下班路上拍到的晚霞，想分享给你」']
    ],
    [1800, 1400, 2800, 3026]
  ))

  children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [headingRun('2.2 页面结构', 2)] }))
  children.push(new Paragraph({
    spacing: spacing(60, 60),
    children: [
      baseRun('首页（信息流）'), baseRun('┬─ 烦恼帖卡片'), baseRun(''), baseRun('└─ 随手拍帖卡片')
    ]
  }))
  children.push(new Paragraph({ children: [baseRun('    │')] }))
  children.push(new Paragraph({ children: [baseRun('    ├── 发帖页面（选择帖子类型 → 填写内容）')] }))
  children.push(new Paragraph({ children: [baseRun('    │')] }))
  children.push(new Paragraph({ children: [baseRun('    └── 帖子详情页 ┬─ 帖子内容')] }))
  children.push(new Paragraph({ children: [baseRun('                   ├─ 匿名评论区')] }))
  children.push(new Paragraph({ spacing: spacing(0, 120), children: [baseRun('                   └─ 举报按钮')] }))

  // ==================== 三、功能需求 ====================
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [headingRun('三、功能需求')] }))

  // 3.1 首页信息流
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [headingRun('3.1 首页信息流', 2)] }))
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: [headingRun('功能描述', 3)] }))
  children.push(new Paragraph({
    spacing: spacing(60, 120),
    children: [baseRun('用户进入网站看到的第一个页面，以列表形式展示最新帖子。')]
  }))
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: [headingRun('详细需求', 3)] }))
  children.push(makeTable(
    ['需求编号', '需求点', '验收标准'],
    [
      ['F-HOME-001', '帖子类型区分', '烦恼帖显示🌧️标识、随手拍帖显示☀️标识，卡片样式有视觉差异'],
      ['F-HOME-002', '随机昵称', '每个帖子显示系统随机生成的昵称（如「温柔的月光小熊」「迷路的云朵」）'],
      ['F-HOME-003', '内容截断', '文字内容超过3行自动截断，点击进入详情查看全文'],
      ['F-HOME-004', '图片预览', '随手拍帖缩略图展示，点击可放大预览'],
      ['F-HOME-005', '无限滚动', '向下滑动自动加载更多，无分页按钮'],
      ['F-HOME-006', '发帖入口', '页面右下角固定悬浮「✏️ 写下你的心事」按钮'],
      ['F-HOME-007', '顶部提示', '页面顶部或底部固定显示风险提示话术']
    ],
    [2000, 2200, 4726]
  ))

  // 3.2 发帖功能
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [headingRun('3.2 发帖功能', 2)] }))
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: [headingRun('功能描述', 3)] }))
  children.push(new Paragraph({
    spacing: spacing(60, 120),
    children: [baseRun('用户可以选择帖子类型并发布内容，全程匿名。')]
  }))
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: [headingRun('详细需求', 3)] }))
  children.push(makeTable(
    ['需求编号', '需求点', '验收标准'],
    [
      ['F-POST-001', '类型选择', '进入发帖页首先选择「🌧️ 烦恼求助」或「☀️ 随手拍分享」'],
      ['F-POST-002', '文字输入', '烦恼帖支持最多2000字，随手拍支持最多200字心情文案'],
      ['F-POST-003', '图片上传', '烦恼帖可选1-3张配图；随手拍必须上传至少1张、最多6张图片'],
      ['F-POST-004', '图片压缩', '前端自动压缩图片（最大宽度1920px，质量80%），单张不超过2MB'],
      ['F-POST-005', 'EXIF清除', '上传前前端清除图片EXIF信息（特别是GPS定位）'],
      ['F-POST-006', '内容审核', '提交时后台审核，拦截自残引导、辱骂、违规内容，返回友好提示'],
      ['F-POST-007', '限流', '同一IP 10分钟内最多发3帖，防止刷屏'],
      ['F-POST-008', '随机昵称', '发帖成功后系统自动生成随机昵称并关联该帖'],
      ['F-POST-009', '发布反馈', '发帖成功显示「🌱 已种下一棵小树苗」温柔提示，自动跳转首页']
    ],
    [2000, 2200, 4726]
  ))

  // 3.3 帖子详情页
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [headingRun('3.3 帖子详情页', 2)] }))
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: [headingRun('功能描述', 3)] }))
  children.push(new Paragraph({
    spacing: spacing(60, 120),
    children: [baseRun('查看完整帖子内容和所有匿名评论。')]
  }))
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: [headingRun('详细需求', 3)] }))
  children.push(makeTable(
    ['需求编号', '需求点', '验收标准'],
    [
      ['F-DETAIL-001', '完整内容', '显示帖子完整文字和全部图片'],
      ['F-DETAIL-002', '图片放大', '点击图片可全屏预览，支持左右滑动切换'],
      ['F-DETAIL-003', '评论区', '按时间顺序展示所有评论，每条评论也有随机昵称'],
      ['F-DETAIL-004', '发表评论', '用户可发表匿名评论，最多500字，同一IP限流'],
      ['F-DETAIL-005', '举报按钮', '每条帖子和评论都有「🚩 举报」入口'],
      ['F-DETAIL-006', '返回首页', '顶部有返回按钮']
    ],
    [2200, 2200, 4526]
  ))

  // 3.4 举报功能
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [headingRun('3.4 举报功能', 2)] }))
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: [headingRun('功能描述', 3)] }))
  children.push(new Paragraph({
    spacing: spacing(60, 120),
    children: [baseRun('用户可以举报违规内容，后台审核处理。')]
  }))
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: [headingRun('详细需求', 3)] }))
  children.push(makeTable(
    ['需求编号', '需求点', '验收标准'],
    [
      ['F-REPORT-001', '举报弹窗', '点击举报按钮弹出原因选择：「违规内容」「自残倾向」「辱骂攻击」「其他」'],
      ['F-REPORT-002', '匿名举报', '举报人信息不公开，不产生举报者记录'],
      ['F-REPORT-003', '提交反馈', '提交后显示「🙏 感谢你的反馈，我们会认真处理」'],
      ['F-REPORT-004', '后台处理', '同一内容被举报3次以上自动进入人工审核队列']
    ],
    [2200, 2200, 4526]
  ))

  // 3.5 主题切换
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [headingRun('3.5 主题切换', 2)] }))
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: [headingRun('功能描述', 3)] }))
  children.push(new Paragraph({
    spacing: spacing(60, 120),
    children: [baseRun('支持浅色/深色两套治愈主题。')]
  }))
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: [headingRun('详细需求', 3)] }))
  children.push(makeTable(
    ['需求编号', '需求点', '验收标准'],
    [
      ['F-THEME-001', '切换入口', '页面右上角有主题切换按钮（☀️/🌙）'],
      ['F-THEME-002', '偏好记忆', '切换后本地存储（localStorage），下次访问自动应用'],
      ['F-THEME-003', '平滑过渡', '切换时有0.3秒淡入淡出过渡效果']
    ],
    [2200, 2200, 4526]
  ))

  // ==================== 四、非功能需求 ====================
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [headingRun('四、非功能需求')] }))

  children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [headingRun('4.1 安全要求', 2)] }))
  children.push(makeTable(
    ['编号', '要求', '说明'],
    [
      ['SEC-001', 'XSS防护', '所有用户输入服务端+前端双重转义，使用DOMPurify'],
      ['SEC-002', 'EXIF清除', '图片上传时使用 exif-js 清除GPS等敏感信息'],
      ['SEC-003', '内容审核', '接入百度/阿里内容安全API，拦截违规内容'],
      ['SEC-004', '接口限流', '使用 express-rate-limit，发帖3次/10min，评论10次/min'],
      ['SEC-005', 'HTTPS', '生产环境强制HTTPS']
    ],
    [1500, 2000, 5426]
  ))

  children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [headingRun('4.2 性能要求', 2)] }))
  children.push(makeTable(
    ['编号', '指标', '目标'],
    [
      ['PERF-001', '首屏加载', '≤ 2秒'],
      ['PERF-002', 'API响应', '≤ 500ms'],
      ['PERF-003', '图片加载', '使用懒加载 + WebP格式']
    ],
    [1800, 3000, 4126]
  ))

  children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [headingRun('4.3 兼容性', 2)] }))
  children.push(new Paragraph({ spacing: spacing(60, 60), children: [baseRun('• 浏览器：Chrome 90+、Firefox 88+、Safari 14+、Edge 90+')] }))
  children.push(new Paragraph({ spacing: spacing(0, 120), children: [baseRun('• 设备：桌面端优先，移动端自适应（响应式）')] }))

  // ==================== 五、风险提示话术 ====================
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [headingRun('五、风险提示话术（全站强制显示）')] }))
  children.push(new Paragraph({
    spacing: spacing(60, 120),
    shading: { fill: 'FFF3E0', type: ShadingType.CLEAR },
    children: [
      new TextRun({
        text: '温馨提示：',
        font: { ascii: LATIN_FONT, hAnsi: LATIN_FONT, eastAsia: CJK_FONT },
        size: 22, bold: true, color: 'E65100'
      }),
      new TextRun({
        text: ' 微光树洞仅为网友匿名情绪陪伴互助社区，不提供专业心理诊疗服务。如果你正承受强烈痛苦、有伤害自己的想法，请立刻联系全国心理危机干预热线寻求专业帮助。',
        font: { ascii: LATIN_FONT, hAnsi: LATIN_FONT, eastAsia: CJK_FONT },
        size: 22
      })
    ]
  }))
  children.push(new Paragraph({
    spacing: spacing(60, 60),
    children: [new TextRun({
      text: '📞 全国24小时心理危机干预热线：',
      font: { ascii: LATIN_FONT, hAnsi: LATIN_FONT, eastAsia: CJK_FONT },
      size: 22, bold: true
    })]
  }))
  children.push(new Paragraph({ children: [baseRun('• 北京心理危机研究与干预中心：010-82951332')] }))
  children.push(new Paragraph({ children: [baseRun('• 全国心理援助热线：400-161-9995')] }))
  children.push(new Paragraph({ spacing: spacing(0, 120), children: [baseRun('• 希望24热线：400-161-9995')] }))

  // ==================== 六、功能范围确认 ====================
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [headingRun('六、功能范围确认')] }))

  children.push(new Paragraph({
    spacing: spacing(120, 120),
    children: [new TextRun({
      text: '✅ 包含功能',
      font: { ascii: LATIN_FONT, hAnsi: LATIN_FONT, eastAsia: CJK_FONT },
      size: 24, bold: true, color: '2E7D32'
    })]
  }))
  const includedFeatures = [
    '首页信息流（烦恼帖+随手拍帖区分展示）',
    '发帖（两种类型、图片上传、EXIF清除、内容审核）',
    '帖子详情页 + 匿名评论',
    '举报功能',
    '浅色/深色主题切换',
    '随机昵称生成'
  ]
  includedFeatures.forEach(f => {
    children.push(new Paragraph({ spacing: spacing(0, 40), children: [baseRun('✔  ' + f)] }))
  })

  children.push(new Paragraph({
    spacing: spacing(200, 120),
    children: [new TextRun({
      text: '❌ 不包含功能（禁止开发）',
      font: { ascii: LATIN_FONT, hAnsi: LATIN_FONT, eastAsia: CJK_FONT },
      size: 24, bold: true, color: 'C62828'
    })]
  }))
  const excludedFeatures = [
    '注册/登录', '私信/聊天', '关注/粉丝', '点赞/收藏/排行榜', '通知推送', '用户画像/行为追踪', '任何流量化设计'
  ]
  excludedFeatures.forEach(f => {
    children.push(new Paragraph({ spacing: spacing(0, 40), children: [baseRun('✖  ' + f)] }))
  })

  // ==================== 七、验收标准总览 ====================
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [headingRun('七、验收标准总览')] }))
  children.push(makeTable(
    ['模块', '验收要点'],
    [
      ['整体', '无注册登录流程，全程匿名；风险提示全站可见'],
      ['首页', '两种帖子类型清晰区分；随机昵称显示；无限滚动'],
      ['发帖', '类型选择→内容输入→图片上传→审核→发布，流程完整'],
      ['详情', '完整内容展示；图片可放大；匿名评论'],
      ['举报', '弹窗→选择原因→提交反馈，流程完整'],
      ['主题', '深浅色切换平滑过渡；偏好本地记忆'],
      ['安全', 'XSS/EXIF/限流措施均已实现']
    ],
    [1800, 7226]
  ))

  // ============ 组装文档 ============
  const doc = new Document({
    styles: docStyles,
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      headers: { default: makeHeader('微光树洞 · PRD') },
      footers: { default: makeFooter() },
      children
    }]
  })

  const buffer = await Packer.toBuffer(doc)
  const outPath = path.join(__dirname, '..', 'docs', '微光树洞-产品需求文档PRD.docx')
  fs.writeFileSync(outPath, buffer)
  console.log('✅ PRD Word 已生成: docs/微光树洞-产品需求文档PRD.docx')
}

// ============ 生成 技术设计文档 ============
async function generateTechDesign() {
  const children = []

  // 封面
  children.push(new Paragraph({ spacing: { before: 2000 } }))
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({
      text: '微光树洞',
      font: { ascii: LATIN_FONT, hAnsi: LATIN_FONT, eastAsia: CJK_FONT },
      size: 72, bold: true, color: '5E35B1'
    })]
  }))
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
    children: [new TextRun({
      text: '技术设计文档',
      font: { ascii: LATIN_FONT, hAnsi: LATIN_FONT, eastAsia: CJK_FONT },
      size: 40, bold: true, color: '7E57C2'
    })]
  }))
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({
      text: '版本：v1.0    更新日期：2026-10-27',
      font: { ascii: LATIN_FONT, hAnsi: LATIN_FONT, eastAsia: CJK_FONT },
      size: 22, color: '9E9E9E'
    })]
  }))
  children.push(new Paragraph({ spacing: { before: 600 } }))

  // ==================== 一、技术选型 ====================
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [headingRun('一、技术选型')] }))

  children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [headingRun('1.1 整体架构', 2)] }))
  children.push(new Paragraph({
    spacing: spacing(60, 120),
    children: [baseRun('前端 Vue3 + Vite + TailwindCSS → 后端 Express.js → 数据层 MySQL + 对象存储')]
  }))

  children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [headingRun('1.2 详细技术栈', 2)] }))
  children.push(makeTable(
    ['层级', '技术', '版本', '用途'],
    [
      ['前端框架', 'Vue 3', '3.4+', 'Composition API'],
      ['构建工具', 'Vite', '5.0+', '快速开发服务器'],
      ['CSS框架', 'TailwindCSS', '3.4+', '原子化CSS'],
      ['路由', 'Vue Router', '4.2+', 'SPA路由管理'],
      ['HTTP客户端', 'Axios', '1.6+', 'API请求'],
      ['XSS防护', 'DOMPurify', '3.0+', '输入输出过滤'],
      ['EXIF清除', 'exif-js', '2.3+', '图片GPS信息移除'],
      ['后端框架', 'Express.js', '4.18+', 'RESTful API'],
      ['数据库', 'MySQL', '8.0+', '关系型存储'],
      ['ORM', 'mysql2', '3.6+', '异步数据库操作'],
      ['安全头', 'helmet', '7.1+', 'HTTP安全响应头'],
      ['限流', 'express-rate-limit', '7.4+', '接口防刷'],
      ['图片处理', 'sharp + multer', '-', '压缩/EXIF清除/上传']
    ],
    [1600, 2400, 1400, 3626]
  ))

  // ==================== 二、数据库设计 ====================
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [headingRun('二、数据库设计')] }))
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [headingRun('2.1 表结构设计', 2)] }))

  // posts 表
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: [headingRun('posts 帖子表', 3)] }))
  children.push(makeTable(
    ['字段', '类型', '约束', '说明'],
    [
      ['id', 'INT', 'PRIMARY KEY AUTO_INCREMENT', '帖子ID'],
      ['type', 'TINYINT', 'NOT NULL DEFAULT 1', '1=烦恼求助, 2=随手拍分享'],
      ['nickname', 'VARCHAR(50)', 'NOT NULL', '系统生成的随机昵称'],
      ['content', 'TEXT', 'NOT NULL', '帖子内容'],
      ['image_count', 'TINYINT', 'NOT NULL DEFAULT 0', '图片数量'],
      ['ip_hash', 'VARCHAR(64)', 'NOT NULL', 'IP哈希（仅用于限流，不可逆）'],
      ['status', 'TINYINT', 'NOT NULL DEFAULT 1', '1=正常, 2=审核中, 3=已屏蔽'],
      ['report_count', 'INT', 'NOT NULL DEFAULT 0', '被举报次数'],
      ['created_at', 'DATETIME', 'NOT NULL DEFAULT CURRENT_TIMESTAMP', '创建时间'],
      ['updated_at', 'DATETIME', 'ON UPDATE CURRENT_TIMESTAMP', '更新时间']
    ],
    [2200, 2000, 2600, 2226]
  ))

  // post_images 表
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: [headingRun('post_images 帖子图片表', 3)] }))
  children.push(makeTable(
    ['字段', '类型', '约束', '说明'],
    [
      ['id', 'INT', 'PRIMARY KEY AUTO_INCREMENT', '图片ID'],
      ['post_id', 'INT', 'NOT NULL, FOREIGN KEY', '关联帖子'],
      ['url', 'VARCHAR(500)', 'NOT NULL', '图片访问URL'],
      ['sort_order', 'TINYINT', 'NOT NULL DEFAULT 0', '排序序号'],
      ['created_at', 'DATETIME', 'NOT NULL DEFAULT CURRENT_TIMESTAMP', '创建时间']
    ],
    [2200, 2000, 2600, 2226]
  ))

  // comments 表
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: [headingRun('comments 评论表', 3)] }))
  children.push(makeTable(
    ['字段', '类型', '约束', '说明'],
    [
      ['id', 'INT', 'PRIMARY KEY AUTO_INCREMENT', '评论ID'],
      ['post_id', 'INT', 'NOT NULL, FOREIGN KEY', '关联帖子'],
      ['nickname', 'VARCHAR(50)', 'NOT NULL', '系统生成的随机昵称'],
      ['content', 'VARCHAR(500)', 'NOT NULL', '评论内容'],
      ['ip_hash', 'VARCHAR(64)', 'NOT NULL', 'IP哈希'],
      ['status', 'TINYINT', 'NOT NULL DEFAULT 1', '1=正常, 2=审核中, 3=已屏蔽'],
      ['report_count', 'INT', 'NOT NULL DEFAULT 0', '被举报次数'],
      ['created_at', 'DATETIME', 'NOT NULL DEFAULT CURRENT_TIMESTAMP', '创建时间']
    ],
    [2200, 2000, 2600, 2226]
  ))

  // reports 表
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: [headingRun('reports 举报表', 3)] }))
  children.push(makeTable(
    ['字段', '类型', '约束', '说明'],
    [
      ['id', 'INT', 'PRIMARY KEY AUTO_INCREMENT', '举报ID'],
      ['target_type', 'TINYINT', 'NOT NULL', '1=帖子, 2=评论'],
      ['target_id', 'INT', 'NOT NULL', '目标ID'],
      ['reason', 'TINYINT', 'NOT NULL', '1=违规内容, 2=自残倾向, 3=辱骂攻击, 4=其他'],
      ['detail', 'VARCHAR(200)', 'NULL', '可选补充说明'],
      ['created_at', 'DATETIME', 'NOT NULL DEFAULT CURRENT_TIMESTAMP', '创建时间']
    ],
    [2200, 2000, 2600, 2226]
  ))

  // ==================== 三、API接口设计 ====================
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [headingRun('三、API接口设计')] }))

  children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [headingRun('3.1 接口列表', 2)] }))
  children.push(makeTable(
    ['方法', '路径', '说明', '限流'],
    [
      ['POST', '/api/posts', '发布帖子（含图片上传）', '3次/10min'],
      ['GET', '/api/posts', '获取帖子列表（分页）', '无严格限流'],
      ['GET', '/api/posts/:id', '获取帖子详情', '无严格限流'],
      ['POST', '/api/comments', '发表评论', '10次/min'],
      ['GET', '/api/comments', '获取评论列表', '无严格限流'],
      ['POST', '/api/reports', '提交举报', '5次/10min'],
      ['GET', '/api/health', '健康检查', '-']
    ],
    [1200, 2800, 3200, 1826]
  ))

  children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [headingRun('3.2 统一响应格式', 2)] }))
  children.push(new Paragraph({
    spacing: spacing(60, 60),
    children: [baseRun('成功响应：{ "code": 0, "message": "ok", "data": {...} }')]
  }))
  children.push(new Paragraph({
    spacing: spacing(0, 120),
    children: [baseRun('错误响应：{ "code": 40001, "message": "错误描述", "data": null }')]
  }))

  children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [headingRun('3.3 错误码定义', 2)] }))
  children.push(makeTable(
    ['错误码', '说明'],
    [
      ['0', '成功'],
      ['40001', '参数校验失败'],
      ['40002', '内容违规被拦截'],
      ['40003', '请求过于频繁（限流）'],
      ['40401', '帖子/资源不存在'],
      ['50001', '服务器内部错误']
    ],
    [2500, 6526]
  ))

  // ==================== 四、匿名昵称生成方案 ====================
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [headingRun('四、匿名昵称生成方案')] }))
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [headingRun('4.1 设计思路', 2)] }))
  children.push(new Paragraph({
    spacing: spacing(60, 120),
    children: [baseRun('从词库中随机组合「形容词 + 名词」，生成温柔治愈风格的随机昵称。')]
  }))

  children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [headingRun('4.2 词库示例', 2)] }))
  children.push(makeTable(
    ['分类', '示例词'],
    [
      ['形容词（温柔治愈向）', '温柔的、迷路的、安静的、勇敢的、柔软的、闪闪发光的、暖暖的、甜甜的...（共30个）'],
      ['名词（自然/治愈向）', '月光小熊、云朵、向日葵、小猫咪、蒲公英、萤火虫、棉花糖、薰衣草...（共30个）']
    ],
    [2200, 6826]
  ))

  children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [headingRun('4.3 唯一性保障', 2)] }))
  children.push(new Paragraph({ spacing: spacing(60, 60), children: [baseRun('• 昵称重复概率极低（30 × 30 = 900种组合）')] }))
  children.push(new Paragraph({ spacing: spacing(0, 60), children: [baseRun('• 数据库不强制唯一，即使重复也不影响匿名性')] }))
  children.push(new Paragraph({ spacing: spacing(0, 120), children: [baseRun('• 生成函数：generateNickname() → "温柔的月光小熊"')] }))

  // ==================== 五、安全方案 ====================
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [headingRun('五、安全方案')] }))

  children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [headingRun('5.1 XSS防护', 2)] }))
  children.push(new Paragraph({
    spacing: spacing(60, 120),
    children: [baseRun('前端 DOMPurify.sanitize() 渲染前过滤 + 后端 DOMPurify + helmet CSP 双重保障，不信任任何用户输入。')]
  }))

  children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [headingRun('5.2 EXIF清除', 2)] }))
  children.push(new Paragraph({
    spacing: spacing(60, 120),
    children: [baseRun('前端：canvas 重新绘制去除EXIF + 后端 sharp 重新编码图片去除元数据（双重兜底）。')]
  }))

  children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [headingRun('5.3 内容审核', 2)] }))
  children.push(new Paragraph({
    spacing: spacing(60, 120),
    children: [baseRun('开发环境使用本地敏感词库（覆盖自残引导/极端暴力/色情/辱骂）；生产环境可接入百度/阿里智能云内容安全API。审核API不可用时降级为本地检查。')]
  }))

  children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [headingRun('5.4 限流策略', 2)] }))
  children.push(makeTable(
    ['接口', '限流规则', 'key'],
    [
      ['/api/posts (POST)', '10分钟内 3次', 'IP哈希'],
      ['/api/comments (POST)', '1分钟内 10次', 'IP哈希'],
      ['/api/reports (POST)', '10分钟内 5次', 'IP哈希']
    ],
    [3000, 3000, 3026]
  ))

  children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [headingRun('5.5 IP哈希方案', 2)] }))
  children.push(new Paragraph({
    spacing: spacing(60, 120),
    children: [baseRun('使用 SHA-256 对 IP + salt 进行哈希，不可逆但可用于限流和去重。盐值通过环境变量 IP_SALT 配置，避免泄露后反推真实IP。')]
  }))

  // ==================== 六、前端设计规范 ====================
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [headingRun('六、前端设计规范')] }))

  children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [headingRun('6.1 主题色', 2)] }))
  children.push(makeTable(
    ['用途', '浅色主题', '深色主题'],
    [
      ['主色调（薰衣草紫）', '#b39ddb', '#9575cd'],
      ['辅助色（天空蓝）', '#90caf9', '#64b5f6'],
      ['强调色（奶油橙）', '#ffcc80', '#ffb74d'],
      ['烦恼帖（雨天蓝）', '#81d4fa', '#4fc3f7'],
      ['随手拍（晴天黄）', '#ffd54f', '#ffca28'],
      ['页面背景', '#faf8fc', '#1a1a2e']
    ],
    [3000, 3000, 3026]
  ))

  children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [headingRun('6.2 视觉风格', 2)] }))
  const styles = [
    '毛玻璃卡片：backdrop-filter blur(16px) saturate(180%)',
    '柔和圆角：16-32px（gentle级别）',
    '淡入动画：fadeInUp 0.6s ease-out',
    '宽松排版：line-height 1.7',
    '低饱和度配色：所有颜色经过 desaturate 处理'
  ]
  styles.forEach(s => {
    children.push(new Paragraph({ spacing: spacing(60, 60), children: [baseRun('• ' + s)] }))
  })

  // ==================== 七、项目目录结构 ====================
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [headingRun('七、项目目录结构')] }))

  children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [headingRun('7.1 前端', 2)] }))
  const feStructure = [
    'frontend/src/',
    '├── api/index.js              # API请求封装',
    '├── assets/style.css          # 主样式+主题变量',
    '├── components/',
    '│   ├── PostCard.vue          # 帖子卡片',
    '│   ├── CommentItem.vue       # 评论项',
    '│   ├── RiskNotice.vue        # 风险提示',
    '│   ├── ThemeToggle.vue       # 主题切换',
    '│   ├── ReportModal.vue       # 举报弹窗',
    '│   ├── ImagePreview.vue      # 图片预览',
    '│   └── FloatingButton.vue    # 悬浮发帖按钮',
    '├── views/',
    '│   ├── HomePage.vue          # 首页信息流',
    '│   ├── CreatePost.vue        # 发帖页',
    '│   └── PostDetail.vue        # 帖子详情',
    '├── composables/',
    '│   ├── useTheme.js           # 主题管理',
    '│   └── useImageUtils.js      # 图片处理',
    '├── router/index.js           # 路由配置',
    '├── App.vue                   # 根组件',
    '└── main.js                   # 入口文件'
  ]
  feStructure.forEach(s => {
    children.push(new Paragraph({ spacing: { before: 20, after: 20 }, children: [baseRun(s)] }))
  })

  children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [headingRun('7.2 后端', 2)] }))
  const beStructure = [
    'backend/src/',
    '├── routes/',
    '│   ├── posts.js              # 帖子API',
    '│   ├── comments.js           # 评论API',
    '│   └── reports.js            # 举报API',
    '├── middleware/',
    '│   ├── security.js           # helmet/cors/XSS清洗',
    '│   ├── rateLimiter.js        # 限流配置',
    '│   ├── audit.js              # 内容审核',
    '│   └── errorHandler.js       # 错误处理',
    '├── utils/',
    '│   ├── nickname.js           # 随机昵称生成',
    '│   ├── ipHash.js             # IP哈希',
    '│   └── timeFormat.js         # 时间格式化',
    '├── db/connection.js          # 数据库连接池',
    '├── uploads/                  # 图片存储目录',
    '└── app.js                    # 入口文件'
  ]
  beStructure.forEach(s => {
    children.push(new Paragraph({ spacing: { before: 20, after: 20 }, children: [baseRun(s)] }))
  })

  // ==================== 八、部署建议 ====================
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [headingRun('八、部署建议')] }))

  children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [headingRun('8.1 开发环境', 2)] }))
  children.push(new Paragraph({ spacing: spacing(60, 40), children: [baseRun('# 前端开发', { bold: true })] }))
  children.push(new Paragraph({ spacing: spacing(0, 40), children: [baseRun('cd frontend && npm install && npm run dev    # http://localhost:5173')] }))
  children.push(new Paragraph({ spacing: spacing(60, 40), children: [baseRun('# 后端开发', { bold: true })] }))
  children.push(new Paragraph({ spacing: spacing(0, 120), children: [baseRun('cd backend && npm install && npm run dev    # http://localhost:3000')] }))

  children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [headingRun('8.2 生产环境', 2)] }))
  children.push(new Paragraph({ spacing: spacing(60, 40), children: [baseRun('# 前端构建', { bold: true })] }))
  children.push(new Paragraph({ spacing: spacing(0, 40), children: [baseRun('cd frontend && npm run build    # 输出到 dist/')] }))
  children.push(new Paragraph({ spacing: spacing(60, 40), children: [baseRun('# 后端PM2守护', { bold: true })] }))
  children.push(new Paragraph({ spacing: spacing(0, 120), children: [baseRun('cd backend && pm2 start src/app.js --name whisper-hole-api')] }))

  // ============ 组装文档 ============
  const doc = new Document({
    styles: docStyles,
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      headers: { default: makeHeader('微光树洞 · 技术设计文档') },
      footers: { default: makeFooter() },
      children
    }]
  })

  const buffer = await Packer.toBuffer(doc)
  const outPath = path.join(__dirname, '..', 'docs', '微光树洞-技术设计文档.docx')
  fs.writeFileSync(outPath, buffer)
  console.log('✅ 技术设计文档 Word 已生成: docs/微光树洞-技术设计文档.docx')
}

// ============ 主入口 ============
async function main() {
  console.log('📄 开始生成 Word 文档...')
  console.log('='.repeat(50))

  await generatePRD()
  await generateTechDesign()

  console.log('='.repeat(50))
  console.log('🎉 两份 Word 文档全部生成完成！')
  console.log('📁 输出目录: docs/')
}

main().catch(err => {
  console.error('❌ 生成失败:', err)
  process.exit(1)
})
