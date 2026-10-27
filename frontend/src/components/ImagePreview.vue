<template>
  <Teleport to="body">
    <transition name="preview">
      <div v-if="visible" class="preview-overlay" @click="handleClose">
        <!-- 关闭按钮 -->
        <button class="close-btn" @click="handleClose">
          ✕
        </button>

        <!-- 上一张 -->
        <button
          v-if="images.length > 1"
          class="nav-btn prev-btn"
          @click.stop="prevImage"
        >
          ‹
        </button>

        <!-- 图片 -->
        <div class="image-container" @click.stop>
          <img
            v-if="currentImage"
            :src="currentImage"
            alt="预览图片"
            class="preview-image"
          />
        </div>

        <!-- 下一张 -->
        <button
          v-if="images.length > 1"
          class="nav-btn next-btn"
          @click.stop="nextImage"
        >
          ›
        </button>

        <!-- 指示器 -->
        <div v-if="images.length > 1" class="indicator">
          {{ currentIndex + 1 }} / {{ images.length }}
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  visible: Boolean,
  images: {
    type: Array,
    default: () => []
  },
  initialIndex: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['update:visible'])

const currentIndex = ref(0)

watch(() => props.visible, (val) => {
  if (val) {
    currentIndex.value = props.initialIndex || 0
  }
})

const currentImage = computed(() => props.images[currentIndex.value])

const handleClose = () => {
  emit('update:visible', false)
}

const prevImage = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
  } else {
    currentIndex.value = props.images.length - 1
  }
}

const nextImage = () => {
  if (currentIndex.value < props.images.length - 1) {
    currentIndex.value++
  } else {
    currentIndex.value = 0
  }
}

// 键盘支持
const handleKeydown = (e) => {
  if (!props.visible) return
  if (e.key === 'Escape') handleClose()
  if (e.key === 'ArrowLeft') prevImage()
  if (e.key === 'ArrowRight') nextImage()
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.92);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: zoom-out;
}

.image-container {
  max-width: 90vw;
  max-height: 85vh;
  overflow: hidden;
  cursor: default;
}

.preview-image {
  max-width: 90vw;
  max-height: 85vh;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.25);
}

.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: none;
  color: white;
  font-size: 36px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease, transform 0.2s ease;
}

.nav-btn:hover {
  background: rgba(255, 255, 255, 0.25);
}

.prev-btn {
  left: 20px;
}

.next-btn {
  right: 20px;
}

.prev-btn:active {
  transform: translateY(-50%) translateX(-3px);
}

.next-btn:active {
  transform: translateY(-50%) translateX(3px);
}

.indicator {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  padding: 6px 16px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  color: white;
  font-size: 14px;
}

/* 过渡 */
.preview-enter-active,
.preview-leave-active {
  transition: opacity 0.3s ease;
}

.preview-enter-from,
.preview-leave-to {
  opacity: 0;
}

.preview-enter-from .preview-image {
  transform: scale(0.9);
}

.preview-leave-to .preview-image {
  transform: scale(0.9);
}

@media (max-width: 640px) {
  .nav-btn {
    width: 44px;
    height: 44px;
    font-size: 28px;
  }
  .prev-btn { left: 10px; }
  .next-btn { right: 10px; }
}
</style>
