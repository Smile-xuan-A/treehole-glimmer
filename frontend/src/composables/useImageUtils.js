import imageCompression from 'browser-image-compression'
import EXIF from 'exif-js'
import DOMPurify from 'dompurify'

/**
 * 图片工具组合式函数
 * 提供图片压缩、EXIF清除、XSS防护
 */
export function useImageUtils() {
  /**
   * 清除图片EXIF信息
   * @param {File} file - 原始图片文件
   * @returns {Promise<File>} - 清除EXIF后的文件
   */
  const removeExif = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          // 创建canvas重新绘制，去除EXIF
          const canvas = document.createElement('canvas')
          canvas.width = img.naturalWidth
          canvas.height = img.naturalHeight
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0)

          canvas.toBlob(
            (blob) => {
              const newFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              })
              resolve(newFile)
            },
            'image/jpeg',
            0.9
          )
        }
        img.src = e.target.result
      }
      reader.readAsDataURL(file)
    })
  }

  /**
   * 压缩图片
   * @param {File} file - 输入文件
   * @returns {Promise<File>} - 压缩后的文件
   */
  const compressImage = async (file) => {
    // 先清除EXIF
    const cleanFile = await removeExif(file)

    // 配置压缩选项
    const options = {
      maxSizeMB: 2,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      quality: 0.8,
      initialQuality: 0.9
    }

    try {
      const compressed = await imageCompression(cleanFile, options)
      // 如果压缩后反而变大，则使用清除EXIF后的原图
      if (compressed.size > cleanFile.size) {
        return cleanFile
      }
      return compressed
    } catch (err) {
      console.warn('[图片压缩失败，使用原图]', err)
      return cleanFile
    }
  }

  /**
   * 批量处理图片（清除EXIF + 压缩）
   * @param {FileList|File[]} files
   * @returns {Promise<File[]>}
   */
  const processImages = async (files) => {
    const fileArray = Array.from(files)
    const results = []
    for (const file of fileArray) {
      // 只处理图片文件
      if (file.type.startsWith('image/')) {
        const processed = await compressImage(file)
        results.push(processed)
      }
    }
    return results
  }

  /**
   * 清理用户输入，防止XSS
   * @param {string} input
   * @returns {string}
   */
  const sanitizeInput = (input) => {
    if (typeof input !== 'string') return ''
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [], // 不允许任何HTML标签
      ALLOWED_ATTR: []
    }).trim()
  }

  /**
   * 验证图片文件
   * @param {File} file
   * @param {Object} options
   * @returns {Object} { valid, error }
   */
  const validateImage = (file, options = {}) => {
    const { maxSizeMB = 5, allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] } = options

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: '仅支持 JPG、PNG、WebP、GIF 格式' }
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      return { valid: false, error: `图片不能超过 ${maxSizeMB}MB` }
    }

    return { valid: true, error: null }
  }

  return {
    removeExif,
    compressImage,
    processImages,
    sanitizeInput,
    validateImage
  }
}
