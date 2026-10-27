<template>
  <div class="comment-item py-3 px-4 rounded-calm transition-colors hover:bg-[var(--bg-hover)]">
    <!-- 头部：昵称 + 时间 -->
    <div class="comment-header flex items-center justify-between mb-2">
      <div class="flex items-center gap-2">
        <div class="avatar-placeholder text-xs w-8 h-8">
          {{ getAvatarEmoji(comment.nickname) }}
        </div>
        <span class="text-sm font-medium" style="color: var(--text-primary)">
          {{ comment.nickname }}
        </span>
      </div>
      <div class="flex items-center gap-3 text-xs" style="color: var(--text-muted)">
        <span>{{ comment.time_ago }}</span>
        <button
          class="report-btn hover:opacity-100 transition-opacity"
          @click="$emit('report', comment)"
          title="举报"
        >
          🚩
        </button>
      </div>
    </div>

    <!-- 评论内容 -->
    <div class="comment-content pl-10">
      <p class="text-sm leading-relaxed" style="color: var(--text-primary)">
        {{ comment.content }}
      </p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  comment: {
    type: Object,
    required: true
  }
})

defineEmits(['report'])

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
.comment-item {
  transition: background var(--duration-normal) ease;
}

.report-btn {
  background: none;
  border: none;
  cursor: pointer;
  opacity: 0.5;
  padding: 2px 4px;
  border-radius: 4px;
}

.report-btn:hover {
  opacity: 1 !important;
}
</style>
