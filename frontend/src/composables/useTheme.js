import { ref, watch, onMounted } from 'vue'

// 主题管理组合式函数
export function useTheme() {
  const THEME_KEY = 'whisper-hole-theme'
  const isDark = ref(false)

  // 初始化主题
  const initTheme = () => {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved) {
      isDark.value = saved === 'dark'
    } else {
      // 跟随系统偏好
      isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    applyTheme()
  }

  // 应用主题到DOM
  const applyTheme = () => {
    const html = document.documentElement
    if (isDark.value) {
      html.setAttribute('data-theme', 'dark')
      html.classList.add('dark')
    } else {
      html.removeAttribute('data-theme')
      html.classList.remove('dark')
    }
  }

  // 切换主题
  const toggleTheme = () => {
    isDark.value = !isDark.value
    localStorage.setItem(THEME_KEY, isDark.value ? 'dark' : 'light')
    applyTheme()
  }

  // 设置主题
  const setTheme = (theme) => {
    isDark.value = theme === 'dark'
    localStorage.setItem(THEME_KEY, isDark.value ? 'dark' : 'light')
    applyTheme()
  }

  watch(isDark, () => {
    applyTheme()
  })

  onMounted(() => {
    initTheme()
  })

  return {
    isDark,
    initTheme,
    toggleTheme,
    setTheme
  }
}
