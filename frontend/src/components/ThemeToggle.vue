<template>
  <button
    class="theme-toggle relative w-10 h-10 rounded-full flex items-center justify-center"
    :title="isDark ? '切换到浅色' : '切换到深色'"
    @click="toggleTheme"
  >
    <span class="theme-icon text-lg transition-all duration-300">
      {{ isDark ? '🌙' : '☀️' }}
    </span>
  </button>
</template>

<script setup>
import { useTheme } from '@/composables/useTheme'

const { isDark, toggleTheme } = useTheme()
</script>

<style scoped>
.theme-toggle {
  background: var(--bg-glass);
  border: 1px solid var(--border-light);
  transition: all 0.3s ease;
  cursor: pointer;
}

.theme-toggle:hover {
  background: var(--bg-hover);
  transform: scale(1.05);
}

.theme-icon {
  display: inline-block;
}

.theme-toggle:hover .theme-icon {
  transform: rotate(15deg);
}
</style>
