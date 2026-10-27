import axios from 'axios'

// 创建API实例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    const { code, message, data } = response.data
    if (code === 0) {
      return data
    } else {
      // 错误处理
      console.error('[API Error]', code, message)
      return Promise.reject(new Error(message))
    }
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response
      console.error('[HTTP Error]', status, data?.message || error.message)
    }
    return Promise.reject(error)
  }
)

// ========== 帖子相关 ==========

/**
 * 获取帖子列表
 * @param {Object} params { page, size, type }
 */
export function getPosts(params = {}) {
  return api.get('/posts', { params })
}

/**
 * 获取帖子详情
 * @param {number} id
 */
export function getPostDetail(id) {
  return api.get(`/posts/${id}`)
}

/**
 * 发布帖子（FormData，包含图片）
 * @param {FormData} formData
 */
export function createPost(formData) {
  return api.post('/posts', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// ========== 评论相关 ==========

/**
 * 获取评论列表
 * @param {Object} params { post_id, page, size }
 */
export function getComments(params) {
  return api.get('/comments', { params })
}

/**
 * 发表评论
 * @param {Object} data { post_id, content }
 */
export function createComment(data) {
  return api.post('/comments', data)
}

// ========== 举报相关 ==========

/**
 * 提交举报
 * @param {Object} data { target_type, target_id, reason, detail }
 */
export function submitReport(data) {
  return api.post('/reports', data)
}

export default api
