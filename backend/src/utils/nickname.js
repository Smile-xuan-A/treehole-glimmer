/**
 * 随机昵称生成器
 * 从词库中随机组合「形容词 + 名词」，生成温柔治愈风格的昵称
 */

// 温柔治愈向 - 形容词词库
const adjectives = [
  '温柔的', '迷路的', '安静的', '孤独的', '勇敢的', '柔软的',
  '闪闪发光的', '轻轻的', '悄悄的', '暖暖的', '清凉的', '甜甜的',
  '淡淡的', '悠悠的', '慢慢的', '静静的', '浅浅的', '软软的',
  '飘着的', '游荡的', '沉睡的', '醒来的', '微笑的', '发呆的',
  '被遗忘的', '藏起来的', '偷偷的', '傻傻的', '可爱的', '善良的'
]

// 自然/治愈向 - 名词词库
const nouns = [
  '月光小熊', '云朵', '向日葵', '小猫咪', '流浪狗', '蒲公英',
  '萤火虫', '星星', '月亮', '小松鼠', '棉花糖', '柠檬茶',
  '雨后彩虹', '海边贝壳', '森林小鹿', '早安面包', '晚风',
  '深夜台灯', '旧书页', '毛绒毯子', '热可可', '晴天娃娃',
  '樱花', '薰衣草', '小刺猬', '大白兔', '绿豆冰沙',
  '纸飞机', '玻璃弹珠', '旧唱片', '月亮船', '小蘑菇'
]

/**
 * 生成随机昵称
 * @returns {string} 如「温柔的月光小熊」
 */
function generateNickname() {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  return adj + noun
}

/**
 * 批量生成不重复的昵称
 * @param {number} count 数量
 * @returns {string[]}
 */
function generateUniqueNicknames(count) {
  const set = new Set()
  let attempts = 0
  const maxAttempts = count * 10 // 防止无限循环

  while (set.size < count && attempts < maxAttempts) {
    set.add(generateNickname())
    attempts++
  }

  return Array.from(set)
}

module.exports = {
  generateNickname,
  generateUniqueNicknames
}
