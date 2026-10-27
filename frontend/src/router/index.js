import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomePage.vue'),
    meta: { title: '微光树洞' }
  },
  {
    path: '/create',
    name: 'create',
    component: () => import('@/views/CreatePost.vue'),
    meta: { title: '写下你的心事' }
  },
  {
    path: '/post/:id',
    name: 'detail',
    component: () => import('@/views/PostDetail.vue'),
    meta: { title: '树洞详情' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0, behavior: 'smooth' }
  }
})

// 页面标题
router.afterEach((to) => {
  const baseTitle = '微光树洞'
  if (to.meta.title && to.meta.title !== baseTitle) {
    document.title = `${to.meta.title} · ${baseTitle}`
  } else {
    document.title = baseTitle
  }
})

export default router
