<template>
  <div class="risk-notice">
    <div class="notice-content glass-card rounded-none border-0 border-t px-4 sm:px-6 py-3">
      <p class="notice-text text-xs sm:text-sm leading-relaxed">
        <span class="notice-icon">💗</span>
        <span class="font-medium">温馨提示：</span>
        微光树洞仅为网友匿名情绪陪伴互助社区，不提供专业心理诊疗服务。
        如果你正承受强烈痛苦、有伤害自己的想法，请立刻联系
        <strong class="hotline" @click="showHotline = !showHotline">
          全国心理危机干预热线 ▼
        </strong>
        寻求专业帮助。
      </p>

      <transition name="slide">
        <div v-if="showHotline" class="hotline-list mt-2 pt-2 border-t" style="border-color: var(--border-light)">
          <div class="hotline-item text-xs py-1">
            <span class="font-medium">📞 北京心理危机研究与干预中心：</span>
            <a href="tel:01082951332" class="hotline-number">010-82951332</a>
          </div>
          <div class="hotline-item text-xs py-1">
            <span class="font-medium">📞 全国心理援助热线：</span>
            <a href="tel:4001619995" class="hotline-number">400-161-9995</a>
          </div>
          <div class="hotline-item text-xs py-1">
            <span class="font-medium">📞 希望24热线：</span>
            <a href="tel:4001619995" class="hotline-number">400-161-9995</a>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const showHotline = ref(false)
</script>

<style scoped>
.risk-notice {
  max-height: 120px;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.risk-notice:has(.notice-content-expanded) {
  max-height: 300px;
}

.notice-content {
  background: linear-gradient(135deg, rgba(255, 204, 240, 0.6), rgba(200, 230, 255, 0.6)) !important;
  backdrop-filter: blur(20px) saturate(180%);
}

[data-theme="dark"] .notice-content {
  background: linear-gradient(135deg, rgba(100, 80, 130, 0.5), rgba(60, 80, 120, 0.5)) !important;
}

.notice-text {
  color: var(--text-secondary);
}

.notice-icon {
  margin-right: 4px;
}

.hotline {
  color: var(--color-primary-dark);
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.hotline:hover {
  color: var(--color-primary);
}

.hotline-number {
  color: var(--color-primary-dark);
  font-weight: 600;
  text-decoration: none;
}

.hotline-number:hover {
  text-decoration: underline;
}

/* 展开动画 */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
  max-height: 0;
}

.slide-enter-to,
.slide-leave-from {
  opacity: 1;
  transform: translateY(0);
  max-height: 200px;
}

@media (max-width: 640px) {
  .risk-notice {
    max-height: 140px;
  }
}
</style>
