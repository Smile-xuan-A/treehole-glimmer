<template>
  <router-link to="/create" class="floating-btn" title="写下你的心事">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 20h9"></path>
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
    </svg>
  </router-link>
</template>

<script setup>
// 悬浮发帖按钮
</script>

<style scoped>
.floating-btn {
  position: fixed;
  bottom: 80px;
  right: 20px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12px 40px rgba(149, 117, 205, 0.35);
  z-index: 50;
  text-decoration: none;
  animation: float-gentle 3s ease-in-out infinite;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.floating-btn:hover {
  transform: scale(1.08);
  box-shadow: 0 16px 48px rgba(149, 117, 205, 0.45);
}

.floating-btn:active {
  transform: scale(0.95);
}

@keyframes float-gentle {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}
</style>
