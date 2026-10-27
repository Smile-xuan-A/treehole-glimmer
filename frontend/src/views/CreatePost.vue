<template>
  <div class="create-page">
    <!-- 返回按钮 -->
    <div class="back-bar mb-4">
      <router-link to="/" class="back-link inline-flex items-center gap-2 text-sm" style="color: var(--text-secondary)">
        ← 返回树洞
      </router-link>
    </div>

    <div class="glass-card animate-fade-in">
      <!-- 标题 -->
      <h2 class="text-xl font-semibold mb-6 flex items-center gap-2" style="color: var(--text-primary)">
        ✏️ 写下你的心事
      </h2>

      <!-- 类型选择 -->
      <div class="type-select mb-6">
        <p class="text-sm mb-3 font-medium" style="color: var(--text-secondary)">选择帖子类型：</p>
        <div class="type-options grid grid-cols-2 gap-3">
          <button
            class="type-btn p-4 rounded-calm text-left transition-all border-2"
            :class="selectedType === 1 ? 'type-btn-active' : ''"
            @click="selectedType = 1"
          >
            <span class="text-2xl block mb-2">🌧️</span>
            <span class="font-medium block">烦恼求助</span>
            <span class="text-xs mt-1 block opacity-70">文字为主，倾诉困惑寻求安慰</span>
          </button>
          <button
            class="type-btn p-4 rounded-calm text-left transition-all border-2"
            :class="selectedType === 2 ? 'type-btn-active' : ''"
            @click="selectedType = 2"
          >
            <span class="text-2xl block mb-2">☀️</span>
            <span class="font-medium block">随手拍分享</span>
            <span class="text-xs mt-1 block opacity-70">图片为主，分享生活传递温暖</span>
          </button>
        </div>
      </div>

      <!-- 文字内容 -->
      <div class="content-input mb-6">
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-medium" style="color: var(--text-secondary)">
            {{ selectedType === 1 ? '你想说些什么？' : '今天想分享什么心情？' }}
          </label>
          <span class="text-xs" :style="{ color: contentLength >= maxLength * 0.9 ? '#ef5350' : 'var(--text-muted)' }">
            {{ contentLength }}/{{ maxLength }}
          </span>
        </div>
        <textarea
          v-model="content"
          class="input-textarea"
          :placeholder="selectedType === 1
            ? '在这里写下你的心事，放心说，这里很安全...'
            : '配几句话吧，让这份温暖更有温度～'"
          :maxlength="maxLength"
          rows="5"
        ></textarea>
      </div>

      <!-- 图片上传 -->
      <div class="image-upload mb-6">
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-medium" style="color: var(--text-secondary)">
            {{ selectedType === 1 ? '配图（可选，最多3张）' : '照片（至少1张，最多6张）' }}
          </label>
          <span class="text-xs" style="color: var(--text-muted)">
            已处理 {{ processedImages.length }}/{{ imageLimit }}
          </span>
        </div>

        <div class="upload-area">
          <!-- 已上传图片预览 -->
          <div v-if="processedImages.length > 0" class="preview-grid mb-3">
            <div
              v-for="(img, idx) in processedImages"
              :key="idx"
              class="preview-item"
            >
              <img :src="img.preview" :alt="'预览' + (idx + 1)" />
              <button
                class="remove-btn"
                @click="removeImage(idx)"
                title="删除"
              >
                ✕
              </button>
              <div v-if="img.processing" class="processing-overlay">
                <span>处理中...</span>
              </div>
            </div>
          </div>

          <!-- 上传按钮 -->
          <div
            v-if="processedImages.length < imageLimit"
            class="upload-btn"
            @click="$refs.fileInput.click()"
          >
            <div class="upload-icon">📷</div>
            <div class="upload-text text-xs">点击或拖拽上传图片</div>
            <div class="upload-hint text-xs opacity-60">
              自动压缩 + 清除定位信息
            </div>
          </div>

          <input
            ref="fileInput"
            type="file"
            :accept="imageAccept"
            multiple
            hidden
            @change="handleFileSelect"
          />
        </div>

        <!-- 错误提示 -->
        <div v-if="imageError" class="error-msg mt-2 text-sm text-red-400">
          {{ imageError }}
        </div>
      </div>

      <!-- 温馨提示 -->
      <div class="tips-box p-4 rounded-calm mb-6" style="background: var(--bg-glass); border: 1px solid var(--border-light)">
        <p class="text-xs leading-relaxed" style="color: var(--text-secondary)">
          💗 <strong>安全承诺：</strong> 你的昵称将由系统随机生成，我们不会收集任何可识别你身份的信息。图片会自动清除定位等敏感信息。
        </p>
      </div>

      <!-- 提交按钮 -->
      <div class="submit-area flex gap-3">
        <router-link to="/" class="btn btn-ghost flex-1">
          取消
        </router-link>
        <button
          class="btn btn-primary flex-1"
          :disabled="!canSubmit || submitting"
          @click="handleSubmit"
        >
          <span v-if="submitting">🌱 发布中...</span>
          <span v-else>{{ selectedType === 1 ? '🌧️ 种下烦恼' : '☀️ 分享温暖' }}</span>
        </button>
      </div>
    </div>

    <!-- 成功提示 -->
    <Teleport to="body">
      <transition name="toast">
        <div v-if="showSuccess" class="success-overlay">
          <div class="success-content glass-card text-center px-8 py-10">
            <div class="success-icon text-5xl mb-4">🌱</div>
            <p class="text-lg font-semibold mb-2" style="color: var(--text-primary)">
              已种下一棵小树苗
            </p>
            <p class="text-sm" style="color: var(--text-secondary)">
              你的心事已安全送达树洞深处
            </p>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { createPost } from '@/api'
import { useImageUtils } from '@/composables/useImageUtils'

const router = useRouter()
const { processImages, sanitizeInput, validateImage } = useImageUtils()

// 表单状态
const selectedType = ref(1)
const content = ref('')
const rawFiles = ref([])
const processedImages = ref([])
const submitting = ref(false)
const showSuccess = ref(false)
const imageError = ref('')

// 字符限制
const maxLength = computed(() => selectedType.value === 1 ? 2000 : 200)
const imageLimit = computed(() => selectedType.value === 1 ? 3 : 6)
const imageAccept = 'image/jpeg,image/png,image/webp,image/gif'

const contentLength = computed(() => content.value.length)

// 是否可以提交
const canSubmit = computed(() => {
  const hasContent = content.value.trim().length > 0
  const hasEnoughImages = selectedType.value === 2 ? processedImages.value.length >= 1 : true
  return hasContent && hasEnoughImages && !submitting.value
})

// 处理文件选择
const handleFileSelect = async (e) => {
  const files = Array.from(e.target.files || [])
  e.target.value = '' // 重置input

  imageError.value = ''

  // 先校验
  for (const file of files) {
    const { valid, error } = validateImage(file, { maxSizeMB: 5 })
    if (!valid) {
      imageError.value = error
      return
    }
  }

  // 检查数量限制
  if (processedImages.value.length + files.length > imageLimit.value) {
    imageError.value = `最多上传 ${imageLimit.value} 张图片`
    return
  }

  // 处理图片
  try {
    const results = await processImages(files)
    results.forEach((file, idx) => {
      processedImages.value.push({
        file,
        preview: URL.createObjectURL(file),
        processing: false,
        sort_order: processedImages.value.length
      })
    })
  } catch (err) {
    imageError.value = '图片处理失败，请重试'
    console.error(err)
  }
}

// 删除图片
const removeImage = (idx) => {
  const removed = processedImages.value.splice(idx, 1)[0]
  if (removed?.preview) {
    URL.revokeObjectURL(removed.preview)
  }
}

// 提交
const handleSubmit = async () => {
  if (!canSubmit.value) return

  submitting.value = true
  imageError.value = ''

  try {
    const formData = new FormData()
    formData.append('type', selectedType.value)
    formData.append('content', sanitizeInput(content.value))

    // 添加图片
    processedImages.value.forEach((img, idx) => {
      formData.append('images', img.file, `image_${idx}.jpg`)
    })

    await createPost(formData)

    // 释放ObjectURL
    processedImages.value.forEach(img => URL.revokeObjectURL(img.preview))

    // 显示成功提示
    showSuccess.value = true
    setTimeout(() => {
      router.push('/')
    }, 1800)
  } catch (err) {
    alert(err.message || '发布失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.back-link {
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 20px;
  transition: all 0.2s ease;
}

.back-link:hover {
  background: var(--bg-hover);
  color: var(--text-primary) !important;
}

/* 类型选择 */
.type-options .type-btn {
  background: var(--bg-glass);
  border-color: var(--border-light);
  color: var(--text-primary);
  cursor: pointer;
}

.type-btn:hover {
  border-color: var(--color-primary-light);
  background: rgba(149, 117, 205, 0.05);
}

.type-btn-active {
  border-color: var(--color-primary) !important;
  background: rgba(149, 117, 205, 0.12) !important;
  box-shadow: 0 0 0 3px rgba(149, 117, 205, 0.15);
}

/* 图片上传 */
.upload-area {
  border-radius: 16px;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 8px;
}

.preview-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  background: var(--bg-hover);
}

.preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.remove-btn:hover {
  background: rgba(239, 83, 80, 0.85);
}

.processing-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.upload-btn {
  aspect-ratio: 1;
  border: 2px dashed var(--border-light);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--bg-glass);
}

.upload-btn:hover {
  border-color: var(--color-primary);
  background: rgba(149, 117, 205, 0.05);
}

.upload-icon {
  font-size: 28px;
}

/* 成功提示 */
.success-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
}

.toast-enter-from .success-content,
.toast-leave-to .success-content {
  transform: scale(0.9);
}
</style>
