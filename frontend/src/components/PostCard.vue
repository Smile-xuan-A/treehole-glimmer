<template>
  <div
    class="post-card glass-card animate-fade-in-up cursor-pointer"
    :class="{
      'glass-card--rain': post.type === 1,
      'glass-card--sun': post.type === 2
    }"
    @click="navigateToDetail"
  >
    <!-- 卡片头部：类型标签 + 昵称 -->
    <div class="card-header flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <span class="tag" :class="post.type === 1 ? 'tag-rain' : 'tag-sun'">
          {{ post.type === 1 ? '🌧️ 烦恼求助' : '☀️ 随手拍' }}
        </span>
      </div>
      <button
        class="report-btn text-xs opacity-50 hover:opacity-100 transition-opacity"
        @click.stop="$emit('report', post)"
      >
        🚩 举报
      </button>
    </div>

    <!-- 昵称行 -->
    <div class="nickname-row flex items-center gap-2 mb-3">
      <div class="avatar-placeholder text-sm">
        {{ getAvatarEmoji(post.nickname) }}
      </div>
      <span class="nickname text-sm font-medium" style="color: var(--text-primary)">
        {{ post.nickname }}
      </span>
    </div>

    <!-- 图片区域（随手拍帖优先显示图片） -->
    <div v-if="post.image_count > 0" class="image-area mb-3">
      <div
        class="image-grid"
        :class="{
          'single-image': post.image_count === 1,
          'multi-image': post.image_count > 1
        }"
      >
        <div
          v-for="(img, idx) in displayImages"
          :key="idx"
          class="image-wrapper"
          @click.stop="previewImage(idx)"
        >
          <img
            :src="img.url"
            :alt="'图片' + (idx + 1)"
            loading="lazy"
            class="post-image"
          />
        </div>
      </div>
    </div>

    <!-- 文字内容 -->
    <div v-if="post.content" class="content-text mb-3">
      <p class="text-sm sm:text-base leading-relaxed line-clamp-3" style="color: var(--text-primary)">
        {{ post.content }}
      </p>
    </div>

    <!-- 卡片底部：时间 + 评论数 -->
    <div class="card-footer flex items-center justify-between text-xs" style="color: var(--text-secondary)">
      <span>{{ post.time_ago }}</span>
      <span class="flex items-center gap-1">
        💬 {{ post.comment_count || 0 }} 条温柔回应
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  post: {
    type: Object,
    required: true
  }
})

defineEmits(['report'])

const router = useRouter()

// 帖子图片列表
const displayImages = computed(() => {
  return props.post.images || []
})

// 跳转详情页
const navigateToDetail = () => {
  router.push(`/post/${props.post.id}`)
}

// 预览图片（在详情页实现完整功能，卡片只做简单跳转）
const previewImage = (idx) => {
  router.push(`/post/${props.post.id}`)
}

// 根据昵称生成头像emoji
const avatarEmojis = ['🐻', '🌸', '🌙', '☁️', '🍀', '🌟', '🦋', '🍃', '🌷', '🐱', '🦊', '🐰']
const getAvatarEmoji = (nickname) => {
  if (!nickname) return '🌸'
  let hash = 0
  for (let i = 0; i < nickname.length; i++) {
    hash = nickname.charCodeAt(i) + ((hash << 5) - hash)
  }
  return avatarEmojis[Math.abs(hash) % avatarEmojis.length]
}
</script>

<style scoped>
.post-card {
  margin-bottom: 16px;
  animation-fill-mode: both;
}

.image-area {
  overflow: hidden;
  border-radius: 16px;
}

.image-grid {
  display: grid;
  gap: 4px;
}

.image-grid.single-image {
  grid-template-columns: 1fr;
  max-height: 320px;
}

.image-grid.multi-image {
  grid-template-columns: repeat(3, 1fr);
  max-height: 240px;
}

.image-wrapper {
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  aspect-ratio: 1;
  background: var(--bg-hover);
  cursor: zoom-in;
}

.image-grid.single-image .image-wrapper {
  aspect-ratio: 4/3;
}

.post-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.image-wrapper:hover .post-image {
  transform: scale(1.03);
}

.nickname-row {
  color: var(--text-primary);
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.report-btn {
  color: var(--text-muted);
}

.report-btn:hover {
  color: #ef5350;
}

@media (max-width: 640px) {
  .image-grid.multi-image {
    grid-template-columns: repeat(3, 1fr);
  }

  .image-grid.single-image {
    max-height: 240px;
  }
}
</style>
