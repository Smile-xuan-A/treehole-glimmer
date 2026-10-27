<template>
  <div class="detail-page">
    <!-- 返回按钮 -->
    <div class="back-bar mb-4">
      <router-link to="/" class="back-link inline-flex items-center gap-2 text-sm" style="color: var(--text-secondary)">
        ← 返回树洞
      </router-link>
    </div>

    <!-- 帖子详情卡片 -->
    <div v-if="post" class="glass-card detail-card animate-fade-in-up mb-6"
      :class="{
        'glass-card--rain': post.type === 1,
        'glass-card--sun': post.type === 2
      }"
    >
      <!-- 头部 -->
      <div class="card-header flex items-center justify-between mb-4">
        <span class="tag" :class="post.type === 1 ? 'tag-rain' : 'tag-sun'">
          {{ post.type === 1 ? '🌧️ 烦恼求助' : '☀️ 随手拍' }}
        </span>
        <button
          class="report-btn text-xs hover:text-red-400 transition-colors"
          @click="openReportModal(1, post.id)"
        >
          🚩 举报
        </button>
      </div>

      <!-- 昵称 -->
      <div class="nickname-row flex items-center gap-3 mb-4">
        <div class="avatar-placeholder text-sm">
          {{ getAvatarEmoji(post.nickname) }}
        </div>
        <div>
          <div class="font-medium" style="color: var(--text-primary)">{{ post.nickname }}</div>
          <div class="text-xs" style="color: var(--text-muted)">{{ post.time_ago }} · 来自匿名的朋友</div>
        </div>
      </div>

      <!-- 图片 -->
      <div v-if="post.images && post.images.length > 0" class="images-area mb-4">
        <div
          v-if="post.images.length === 1"
          class="single-image-wrapper rounded-calm overflow-hidden"
          @click="openImagePreview(0)"
        >
          <img
            :src="post.images[0].url"
            alt="帖子图片"
            class="w-full max-h-[400px] object-cover cursor-zoom-in"
          />
        </div>
        <div
          v-else
          class="multi-image-grid grid grid-cols-3 gap-2 rounded-calm overflow-hidden"
        >
          <div
            v-for="(img, idx) in post.images"
            :key="idx"
            class="multi-img-wrapper cursor-zoom-in"
            @click="openImagePreview(idx)"
          >
            <img :src="img.url" alt="图片" class="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      <!-- 文字内容 -->
      <div v-if="post.content" class="content-text">
        <p class="whitespace-pre-wrap leading-relaxed" style="color: var(--text-primary)">
          {{ post.content }}
        </p>
      </div>
    </div>

    <!-- 加载中 -->
    <div v-else-if="loading" class="glass-card text-center py-12">
      <div class="text-2xl mb-3 animate-pulse">🌿</div>
      <p class="text-sm" style="color: var(--text-muted)">正在倾听树洞的声音...</p>
    </div>

    <!-- 加载失败 -->
    <div v-else class="glass-card text-center py-12">
      <div class="text-4xl mb-3">🍂</div>
      <p class="mb-4" style="color: var(--text-secondary)">这条心事可能已经被风吹走了</p>
      <router-link to="/" class="btn btn-primary">返回首页</router-link>
    </div>

    <!-- 评论区 -->
    <div v-if="post" class="comments-section">
      <div class="section-header mb-4">
        <h3 class="text-lg font-semibold flex items-center gap-2">
          💬 <span style="color: var(--text-primary)">温柔回应</span>
          <span class="text-sm font-normal" style="color: var(--text-muted)">
            ({{ comments.length }}条)
          </span>
        </h3>
      </div>

      <!-- 发表评论 -->
      <div class="comment-input glass-card mb-5 p-4">
        <textarea
          v-model="newComment"
          class="input-textarea text-sm"
          rows="3"
          placeholder="说点温柔的话吧..."
          maxlength="500"
        ></textarea>
        <div class="flex items-center justify-between mt-3">
          <span class="text-xs" :style="{ color: newComment.length >= 450 ? '#ef5350' : 'var(--text-muted)' }">
            {{ newComment.length }}/500
          </span>
          <button
            class="btn btn-primary text-sm py-2 px-4"
            :disabled="!canSubmitComment || submittingComment"
            @click="submitComment"
          >
            <span v-if="submittingComment">发送中...</span>
            <span v-else>发送 💌</span>
          </button>
        </div>
      </div>

      <!-- 评论列表 -->
      <div v-if="comments.length > 0" class="comments-list">
        <div
          v-for="(comment, idx) in comments"
          :key="comment.id"
          class="glass-card mb-2 animate-fade-in-up"
          :style="{ animationDelay: idx * 0.05 + 's' }"
        >
          <CommentItem
            :comment="comment"
            @report="openReportModal(2, comment.id)"
          />
        </div>
      </div>

      <!-- 评论加载更多 -->
      <div v-if="hasMoreComments && !loadingComments" class="text-center py-3">
        <button class="btn btn-ghost text-sm" @click="loadMoreComments">
          加载更多回应
        </button>
      </div>

      <!-- 评论空状态 -->
      <div v-else-if="!loadingComments && comments.length === 0" class="text-center py-8 text-sm" style="color: var(--text-muted)">
        🌱 还没有人回应，也许你可以成为第一个...
      </div>
    </div>

    <!-- 图片预览 -->
    <ImagePreview
      v-model:visible="previewVisible"
      :images="previewImages"
      :initial-index="previewIndex"
    />

    <!-- 举报弹窗 -->
    <ReportModal
      v-model:visible="reportModalVisible"
      :target="reportTarget"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getPostDetail, getComments, createComment } from '@/api'
import PostCard from '@/components/PostCard.vue'
import CommentItem from '@/components/CommentItem.vue'
import ImagePreview from '@/components/ImagePreview.vue'
import ReportModal from '@/components/ReportModal.vue'
import { useImageUtils } from '@/composables/useImageUtils'

const route = useRoute()
const { sanitizeInput } = useImageUtils()

const postId = computed(() => Number(route.params.id))

// 帖子详情
const post = ref(null)
const loading = ref(true)

// 评论
const comments = ref([])
const commentsPage = ref(1)
const commentsPageSize = 20
const hasMoreComments = ref(true)
const loadingComments = ref(false)
const newComment = ref('')
const submittingComment = ref(false)

// 图片预览
const previewVisible = ref(false)
const previewImages = ref([])
const previewIndex = ref(0)

// 举报
const reportModalVisible = ref(false)
const reportTarget = ref(null)

// 是否可以提交评论
const canSubmitComment = computed(() => newComment.value.trim().length > 0)

// 获取帖子详情
const fetchPost = async () => {
  loading.value = true
  try {
    const data = await getPostDetail(postId.value)
    post.value = data || getMockPost()
  } catch (err) {
    console.warn('[使用Mock数据]', err.message)
    post.value = getMockPost()
  } finally {
    loading.value = false
  }
}

// 获取评论
const fetchComments = async (reset = false) => {
  if (loadingComments.value) return
  if (!hasMoreComments.value && !reset) return

  if (reset) {
    commentsPage.value = 1
    comments.value = []
    hasMoreComments.value = true
  }

  loadingComments.value = true
  try {
    const data = await getComments({
      post_id: postId.value,
      page: commentsPage.value,
      size: commentsPageSize
    })
    const list = data?.list || getMockComments(postId.value)
    comments.value = reset ? list : [...comments.value, ...list]
    hasMoreComments.value = data?.has_more !== false && commentsPage.value < 2
    commentsPage.value++
  } catch (err) {
    console.warn('[使用Mock评论]', err.message)
    const list = reset ? getMockComments(postId.value) : []
    comments.value = reset ? list : [...comments.value, ...list]
    hasMoreComments.value = false
  } finally {
    loadingComments.value = false
  }
}

const loadMoreComments = () => fetchComments()

// 提交评论
const submitComment = async () => {
  if (!canSubmitComment.value) return

  submittingComment.value = true
  try {
    const result = await createComment({
      post_id: postId.value,
      content: sanitizeInput(newComment.value)
    })

    // 添加到列表头部
    const newItem = result || {
      id: Date.now(),
      nickname: getRandomNickname(),
      content: newComment.value,
      time_ago: '刚刚'
    }
    comments.value.unshift(newItem)
    newComment.value = ''
  } catch (err) {
    alert(err.message || '发送失败，请稍后重试')
  } finally {
    submittingComment.value = false
  }
}

// 图片预览
const openImagePreview = (idx) => {
  if (!post.value?.images?.length) return
  previewImages.value = post.value.images.map(img => img.url)
  previewIndex.value = idx
  previewVisible.value = true
}

// 举报
const openReportModal = (targetType, targetId) => {
  reportTarget.value = { target_type: targetType, target_id: targetId }
  reportModalVisible.value = true
}

// 头像emoji
const avatarEmojis = ['🐻', '🌸', '🌙', '☁️', '🍀', '🌟', '🦋', '🍃', '🌷', '🐱', '🦊', '🐰']
const getAvatarEmoji = (nickname) => {
  if (!nickname) return '🌸'
  let hash = 0
  for (let i = 0; i < nickname.length; i++) {
    hash = nickname.charCodeAt(i) + ((hash << 5) - hash)
  }
  return avatarEmojis[Math.abs(hash) % avatarEmojis.length]
}

// 随机昵称（Mock用）
function getRandomNickname() {
  const adjs = ['温柔的', '迷路的', '安静的', '勇敢的', '柔软的', '闪闪发光的', '暖暖的']
  const nouns = ['月光小熊', '云朵', '向日葵', '小猫咪', '蒲公英', '萤火虫']
  return adjs[Math.floor(Math.random() * adjs.length)] + nouns[Math.floor(Math.random() * nouns.length)]
}

onMounted(async () => {
  await fetchPost()
  await fetchComments(true)
})

// ============ Mock 数据 ============
function getMockPost() {
  const id = postId.value
  return {
    id,
    type: 1,
    nickname: '温柔的月光小熊',
    content: '今天是第三次面试失败了...我是不是真的很差劲？\n\n每次都满怀信心地准备，把公司的业务研究了又研究，把可能问到的问题都演练了一遍。但到了现场，脑子就一片空白，出来的时候连自己说了什么都记不清。\n\n不敢告诉爸妈，怕他们担心；不敢告诉朋友，怕他们觉得我没用。只能一个人在出租屋里，对着天花板发呆。\n\n写这段话的时候，眼泪又掉下来了。抱歉让你看到这么丧的我...',
    images: [],
    image_count: 0,
    comment_count: 5,
    time_ago: '2小时前'
  }
}

function getMockComments() {
  return [
    {
      id: 1001,
      nickname: '安静的向日葵',
      content: '抱抱你。我去年也是连续面试失败了五六次，那种自我怀疑真的很折磨人。但请相信，这不是你的问题，只是还没遇到那个对的机会。你已经在很努力了，这本身就很棒了 🌻',
      time_ago: '1小时前'
    },
    {
      id: 1002,
      nickname: '迷路的云朵',
      content: '我懂这种感觉。但你知道吗？面试也是需要经验的。多面几次就会越来越顺手的。每一次失败其实都是在帮你排除一个不适合你的公司。',
      time_ago: '45分钟前'
    },
    {
      id: 1003,
      nickname: '闪闪发光的萤火虫',
      content: '给你一个隔空的拥抱 🤗 其实你能勇敢地去面试，就已经比很多人强了。给自己一点时间，也给自己一些耐心。',
      time_ago: '30分钟前'
    },
    {
      id: 1004,
      nickname: '暖暖的小猫咪',
      content: '我之前看《被讨厌的勇气》里说，努力了却没有得到预期结果，不是因为你不够好，而是因为你在"课题分离"——公司有公司的考量，你有你的价值。你的价值不是由面试结果决定的哦。',
      time_ago: '20分钟前'
    },
    {
      id: 1005,
      nickname: '柔软的棉花糖',
      content: '今天出门的时候看到路边的樱花开了，特别美。等你心情好一点，可以出去走走，说不定会遇到什么好事呢。世界不会一直阴天的 ☀️',
      time_ago: '10分钟前'
    }
  ]
}
</script>

<style scoped>
.back-link {
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 20px;
  transition: all 0.2s ease;
}

.back-link:hover {
  background: var(--bg-hover);
  color: var(--text-primary) !important;
}

.multi-img-wrapper {
  aspect-ratio: 1;
  background: var(--bg-hover);
  overflow: hidden;
  border-radius: 8px;
}

.multi-img-wrapper img {
  transition: transform 0.3s ease;
}

.multi-img-wrapper:hover img {
  transform: scale(1.05);
}

.report-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
}

/* 评论区卡片内边距减小 */
.comment-list .glass-card {
  padding: 8px 0 !important;
}
</style>
