<template>
  <Teleport to="body">
    <transition name="modal">
      <div v-if="visible" class="modal-overlay" @click.self="handleClose">
        <div class="modal-content glass-card w-[90%] max-w-md animate-fade-in-up">
          <!-- 标题 -->
          <h3 class="text-lg font-semibold mb-4 flex items-center gap-2" style="color: var(--text-primary)">
            🚩 举报内容
          </h3>

          <!-- 原因选择 -->
          <p class="text-sm mb-3" style="color: var(--text-secondary)">
            请选择举报原因：
          </p>
          <div class="reason-list space-y-2 mb-4">
            <button
              v-for="reason in reasons"
              :key="reason.value"
              class="reason-btn w-full text-left px-4 py-3 rounded-calm text-sm transition-all"
              :class="{ 'reason-btn-active': selectedReason === reason.value }"
              @click="selectedReason = reason.value"
            >
              <span class="mr-2">{{ reason.icon }}</span>
              {{ reason.label }}
            </button>
          </div>

          <!-- 补充说明（可选） -->
          <div class="mb-4">
            <textarea
              v-model="detail"
              class="input-textarea text-sm"
              rows="2"
              placeholder="补充说明（选填）"
              maxlength="200"
            ></textarea>
          </div>

          <!-- 按钮 -->
          <div class="flex items-center gap-3">
            <button class="btn btn-ghost flex-1" @click="handleClose">
              取消
            </button>
            <button
              class="btn btn-primary flex-1"
              :disabled="!selectedReason || submitting"
              @click="handleSubmit"
            >
              <span v-if="submitting">提交中...</span>
              <span v-else>提交举报</span>
            </button>
          </div>

          <!-- 提交成功提示 -->
          <transition name="toast">
            <div v-if="showSuccess" class="success-toast mt-4 text-center text-sm py-3 rounded-calm">
              🙏 感谢你的反馈，我们会认真处理
            </div>
          </transition>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import { submitReport } from '@/api'

const props = defineProps({
  visible: Boolean,
  target: Object // { target_type: 1|2, target_id: number }
})

const emit = defineEmits(['update:visible', 'submitted'])

const reasons = [
  { value: 1, label: '违规内容', icon: '⚠️' },
  { value: 2, label: '自残倾向', icon: '🆘' },
  { value: 3, label: '辱骂攻击', icon: '😡' },
  { value: 4, label: '其他', icon: '❓' }
]

const selectedReason = ref(null)
const detail = ref('')
const submitting = ref(false)
const showSuccess = ref(false)

// 重置状态
watch(() => props.visible, (val) => {
  if (val) {
    selectedReason.value = null
    detail.value = ''
    showSuccess.value = false
  }
})

const handleClose = () => {
  emit('update:visible', false)
}

const handleSubmit = async () => {
  if (!selectedReason.value || !props.target) return

  submitting.value = true
  try {
    await submitReport({
      target_type: props.target.target_type,
      target_id: props.target.target_id,
      reason: selectedReason.value,
      detail: detail.value || undefined
    })

    showSuccess.value = true
    emit('submitted')

    setTimeout(() => {
      handleClose()
    }, 1500)
  } catch (err) {
    alert(err.message || '提交失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
}

.reason-btn {
  background: var(--bg-glass);
  border: 1px solid var(--border-light);
  color: var(--text-primary);
  cursor: pointer;
}

.reason-btn:hover {
  background: var(--bg-hover);
}

.reason-btn-active {
  border-color: var(--color-primary);
  background: rgba(149, 117, 205, 0.1);
}

.success-toast {
  background: linear-gradient(135deg, rgba(129, 199, 132, 0.2), rgba(165, 214, 167, 0.2));
  border: 1px solid rgba(129, 199, 132, 0.3);
  color: #2e7d32;
}

[data-theme="dark"] .success-toast {
  color: #81c784;
}

/* 模态框过渡 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.9) translateY(20px);
}

/* Toast过渡 */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
