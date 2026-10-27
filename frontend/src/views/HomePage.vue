<template>
  <div class="home-page">
    <!-- 页面标题区 -->
    <div class="page-header text-center mb-6 animate-fade-in">
      <h1 class="page-title text-2xl sm:text-3xl font-semibold mb-2">
        🌳 微光树洞
      </h1>
      <p class="page-subtitle text-sm" style="color: var(--text-secondary)">
        在这里，你可以安全地倾诉，也可以给陌生人一点温暖 💗
      </p>
    </div>

    <!-- 帖子列表 -->
    <div class="post-list">
      <TransitionGroup name="list">
        <PostCard
          v-for="post in posts"
          :key="post.id"
          :post="post"
          @report="openReportModal($event)"
        />
      </TransitionGroup>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading && posts.length === 0" class="loading-state text-center py-12">
      <div class="loading-dots">
        <span></span><span></span><span></span>
      </div>
      <p class="mt-3 text-sm" style="color: var(--text-muted)">正在倾听树洞的声音...</p>
    </div>

    <!-- 加载更多 -->
    <div v-if="hasMore && !loading" class="load-more text-center py-4">
      <button class="btn btn-ghost" @click="loadMore">
        🌱 继续倾听
      </button>
    </div>

    <!-- 没有更多 -->
    <div v-if="!hasMore && posts.length > 0" class="no-more text-center py-6 text-sm" style="color: var(--text-muted)">
      🍃 树洞暂时安静了，稍后再来看看吧
    </div>

    <!-- 空状态 -->
    <div v-if="!loading && posts.length === 0" class="empty-state text-center py-16 glass-card animate-fade-in">
      <div class="text-5xl mb-4">🌿</div>
      <p class="text-lg font-medium mb-2">树洞还很安静</p>
      <p class="text-sm mb-4" style="color: var(--text-secondary)">成为第一个留下心事的人吧</p>
      <router-link to="/create" class="btn btn-primary">
        ✏️ 写下你的心事
      </router-link>
    </div>

    <!-- 举报弹窗 -->
    <ReportModal
      v-model:visible="reportModalVisible"
      :target="reportTarget"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getPosts } from '@/api'
import PostCard from '@/components/PostCard.vue'
import ReportModal from '@/components/ReportModal.vue'

const posts = ref([])
const page = ref(1)
const pageSize = 10
const hasMore = ref(true)
const loading = ref(false)

// 举报弹窗
const reportModalVisible = ref(false)
const reportTarget = ref(null)

// 加载帖子列表
const fetchPosts = async (reset = false) => {
  if (loading.value) return

  if (reset) {
    page.value = 1
    posts.value = []
    hasMore.value = true
  }

  if (!hasMore.value) return

  loading.value = true
  try {
    const data = await getPosts({
      page: page.value,
      size: pageSize
    })

    // 如果后端不可用，使用Mock数据兜底
    const list = data?.list || getMockPosts(page.value)
    posts.value = reset ? list : [...posts.value, ...list]
    hasMore.value = list.length >= pageSize && data?.has_more !== false
    page.value++
  } catch (err) {
    console.warn('[使用Mock数据兜底]', err.message)
    // 网络失败时用Mock数据
    const list = getMockPosts(page.value)
    posts.value = reset ? list : [...posts.value, ...list]
    hasMore.value = page.value < 3
    page.value++
  } finally {
    loading.value = false
  }
}

const loadMore = () => fetchPosts()

// 打开举报弹窗
const openReportModal = (post) => {
  reportTarget.value = { target_type: 1, target_id: post.id }
  reportModalVisible.value = true
}

onMounted(() => {
  fetchPosts(true)
})

// Mock数据（后端不可用时使用）
function getMockPosts(page = 1) {
  const mockData = [
    {
      id: page * 10 + 1,
      type: 1,
      nickname: '温柔的月光小熊',
      content: '今天是第三次面试失败了...我是不是真的很差劲？每次都满怀信心地准备，但结果总是石沉大海。不敢告诉爸妈，怕他们担心，只能一个人在出租屋里哭。',
      images: [],
      image_count: 0,
      comment_count: 12,
      created_at: new Date(Date.now() - 7200000).toISOString(),
      time_ago: '2小时前'
    },
    {
      id: page * 10 + 2,
      type: 2,
      nickname: '迷路的云朵',
      content: '下班路上抬头看到的天空，像被打翻的橘子汽水 🧡 想分享给正在烦恼的你，世界还是有很多美好的瞬间的。',
      images: [
        { url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600', sort_order: 0 }
      ],
      image_count: 1,
      comment_count: 8,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      time_ago: '1小时前'
    },
    {
      id: page * 10 + 3,
      type: 1,
      nickname: '安静的向日葵',
      content: '和交往了三年的男朋友分手了。没有出轨，没有争吵，就是慢慢发现两个人想要的东西不一样。很平静地聊了很久，最后还是决定分开。现在一个人坐在以前常去的奶茶店，点了两杯，一杯给他，一杯给我自己。',
      images: [],
      image_count: 0,
      comment_count: 23,
      created_at: new Date(Date.now() - 1800000).toISOString(),
      time_ago: '30分钟前'
    },
    {
      id: page * 10 + 4,
      type: 2,
      nickname: '闪闪发光的萤火虫',
      content: '今早起来发现窗台的多肉开花了！养了快两年，第一次看到它开花。小小的一簇白色的花，特别可爱✨ 原来坚持真的会有回报。',
      images: [
        { url: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600', sort_order: 0 },
        { url: 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=600', sort_order: 1 }
      ],
      image_count: 2,
      comment_count: 15,
      created_at: new Date(Date.now() - 900000).toISOString(),
      time_ago: '15分钟前'
    },
    {
      id: page * 10 + 5,
      type: 1,
      nickname: '柔软的棉花糖',
      content: '考研二战，还有20天就考试了，今天做模拟卷分数比去年还低。每天学到凌晨，头发掉了一大把，却还是看不到希望。有时候真的很想放弃，但又不甘心...',
      images: [],
      image_count: 0,
      comment_count: 31,
      created_at: new Date(Date.now() - 600000).toISOString(),
      time_ago: '10分钟前'
    },
    {
      id: page * 10 + 6,
      type: 2,
      nickname: '暖暖的小猫咪',
      content: '今天天气很好，在公园晒太阳的时候遇到了这只小橘。它一直蹭我腿，好像也想分享一下阳光 ☀️',
      images: [
        { url: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=600', sort_order: 0 }
      ],
      image_count: 1,
      comment_count: 19,
      created_at: new Date(Date.now() - 300000).toISOString(),
      time_ago: '5分钟前'
    }
  ]
  return mockData
}
</script>

<style scoped>
.home-page {
  min-height: 100%;
}

.page-header {
  padding: 20px 0;
}

.page-title {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* 列表动画 */
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* 加载动画 */
.loading-dots {
  display: inline-flex;
  gap: 6px;
}

.loading-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-primary);
  animation: dot-bounce 1.4s infinite ease-in-out both;
}

.loading-dots span:nth-child(1) { animation-delay: -0.32s; }
.loading-dots span:nth-child(2) { animation-delay: -0.16s; }

@keyframes dot-bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}
</style>
