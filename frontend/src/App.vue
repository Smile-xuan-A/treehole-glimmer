<template>
  <div class="app-container min-h-screen" :class="themeClass">
    <!-- 顶部导航栏 -->
    <header class="app-header sticky top-0 z-40">
      <div class="header-inner glass-card rounded-none border-0 border-b px-4 sm:px-6 py-3 flex items-center justify-between">
        <!-- Logo -->
        <router-link to="/" class="flex items-center gap-2 group">
          <span class="text-2xl group-hover:scale-110 transition-transform">🌳</span>
          <span class="font-semibold text-lg tracking-wide" style="color: var(--text-primary)">
            微光树洞
          </span>
        </router-link>

        <!-- 右侧操作 -->
        <div class="flex items-center gap-2 sm:gap-3">
          <!-- 主题切换 -->
          <ThemeToggle />
        </div>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="app-main px-4 sm:px-6 py-6 max-w-2xl mx-auto">
      <router-view v-slot="{ Component }">
        <transition name="page-transition" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- 全局风险提示 -->
    <RiskNotice class="app-notice" />

    <!-- 悬浮发帖按钮 -->
    <FloatingButton v-if="!hideFloating" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useTheme } from '@/composables/useTheme'
import ThemeToggle from '@/components/ThemeToggle.vue'
import RiskNotice from '@/components/RiskNotice.vue'
import FloatingButton from '@/components/FloatingButton.vue'

const route = useRoute()
const { isDark, initTheme } = useTheme()

// 初始化主题
initTheme()

// 主题class
const themeClass = computed(() => ({
  'theme-dark': isDark.value
}))

// 发帖页面隐藏悬浮按钮（避免与页面内按钮冲突）
const hideFloating = computed(() => route.path === '/create')
</script>

<style scoped>
.app-container {
  background: var(--gradient-bg);
}

.app-header {
  background: rgba(250, 248, 252, 0.8);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
}

[data-theme="dark"] .app-header {
  background: rgba(26, 26, 46, 0.8);
}

.header-inner {
  background: transparent !important;
  box-shadow: none !important;
}

.app-main {
  padding-bottom: 100px; /* 给风险提示留空间 */
}

.app-notice {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 30;
}

@media (max-width: 640px) {
  .app-header .header-inner {
    padding: 12px 16px;
  }
}
</style>
