<!-- src/views/DetailView.vue -->
<template>
  <div class="detail-container">
    <!-- 头部导航 -->
    <div class="detail-header">
      <button @click="goBack" class="back-btn">
        <span class="back-icon">←</span>
        <span>返回</span>
      </button>
      
      <h1 class="page-title">菜谱详情</h1>
      
      <button 
        @click="toggleFavorite"
        class="favorite-header-btn"
        :class="{ 'active': isFavorite }"
        :title="isFavorite ? '取消收藏' : '收藏'"
      >
        <span v-if="isFavorite" class="favorite-icon">❤️</span>
        <span v-else class="favorite-icon">🤍</span>
      </button>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>正在加载菜谱详情...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <h3>加载失败</h3>
      <p>{{ error }}</p>
      <button @click="goBack" class="retry-btn">返回首页</button>
    </div>

    <!-- 菜谱内容 -->
    <div v-else-if="recipe" class="detail-content">
      <!-- 菜谱标题区域 -->
      <div class="recipe-hero">
        <div class="title-section">
          <h2 class="display-name">{{ recipe.displayName }}</h2>
          <p class="original-name">「{{ recipe.originalName }}」</p>
          
          <div class="recipe-meta">
            <span v-if="recipe.cookingTime" class="meta-item">
              <span class="meta-icon">⏱️</span>
              {{ recipe.cookingTime }}分钟
            </span>
            <span v-if="recipe.difficulty" class="meta-item">
              <span class="meta-icon">🔥</span>
              {{ recipe.difficulty }}
            </span>
            <span v-if="recipe.category?.length" class="meta-item">
              <span class="meta-icon">🏷️</span>
              {{ recipe.category[0] }}
            </span>
          </div>
        </div>
      </div>

      <!-- 菜谱描述 -->
      <div class="description-section">
        <h3 class="section-title">
          <span class="section-icon">📝</span>
          菜品介绍
        </h3>
        <p class="description-text">{{ recipe.description }}</p>
      </div>

      <!-- AI生成的故事 -->
      <div v-if="recipe.story" class="story-section">
        <div class="section-header">
          <h3 class="section-title">
            <span class="section-icon">✨</span>
            AI风味故事
          </h3>
          <span class="ai-badge">AI生成</span>
        </div>
        <div class="story-content">
          <div class="quote-mark">「</div>
          <p>{{ recipe.story }}</p>
          <div class="quote-mark">」</div>
        </div>
      </div>

      <!-- 所需食材 -->
      <div class="ingredients-section">
        <h3 class="section-title">
          <span class="section-icon">🥗</span>
          所需食材
          <span class="ingredients-count">({{ recipe.ingredients.length }}种)</span>
        </h3>
        <div class="ingredients-list">
          <div 
            v-for="(ingredient, index) in recipe.ingredients" 
            :key="index"
            class="ingredient-item"
            :style="{ '--delay': index * 0.1 + 's' }"
          >
            <span class="check-icon">✓</span>
            <span class="ingredient-name">{{ ingredient }}</span>
          </div>
        </div>
      </div>

      <!-- 制作步骤 -->
      <div class="steps-section">
        <h3 class="section-title">
          <span class="section-icon">👨‍🍳</span>
          制作步骤
          <span class="steps-count">({{ recipe.steps.length }}步)</span>
        </h3>
        <div class="steps-list">
          <div 
            v-for="(step, index) in recipe.steps" 
            :key="index"
            class="step-item"
          >
            <div class="step-number">{{ index + 1 }}</div>
            <div class="step-content">
              <p>{{ step }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 风味分析 -->
      <div v-if="recipe.flavorProfile" class="flavor-section">
        <h3 class="section-title">
          <span class="section-icon">📊</span>
          风味分析
        </h3>
        <div class="flavor-hint">
          <p>等待C同学的风味雷达图组件...</p>
          <div class="flavor-preview">
            <div 
              v-for="(value, key) in recipe.flavorProfile" 
              :key="key"
              class="flavor-bar-item"
            >
              <div class="flavor-info">
                <span class="flavor-name">{{ getFlavorLabel(key) }}</span>
                <span class="flavor-value">{{ value }}/5</span>
              </div>
              <div class="bar-container">
                <div 
                  class="bar-fill"
                  :style="{
                    width: `${(value / 5) * 100}%`,
                    backgroundColor: getFlavorColor(key)
                  }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 小贴士 -->
      <div v-if="recipe.tips" class="tips-section">
        <h3 class="section-title">
          <span class="section-icon">💡</span>
          小贴士
        </h3>
        <div class="tips-content">
          <p>{{ recipe.tips }}</p>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button @click="goBack" class="secondary-btn">
          <span>← 返回首页</span>
        </button>
        <button @click="toggleFavorite" class="primary-btn">
          <span v-if="isFavorite">❤️ 已收藏</span>
          <span v-else>🤍 收藏此菜谱</span>
        </button>
      </div>
    </div>

    <!-- 没有菜谱数据 -->
    <div v-else class="empty-state">
      <div class="empty-icon">🍳</div>
      <h3>未找到菜谱</h3>
      <p>该菜谱可能已被删除或不存在</p>
      <button @click="goBack" class="home-btn">返回首页</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRecipeStore } from '@/stores/recipe'
import { getRecipeByIdService } from '@/services/recipeService'
import type { Recipe, FlavorProfile } from '@/types/recipe'

const route = useRoute()
const router = useRouter()
const recipeStore = useRecipeStore()

// 状态
const recipe = ref<Recipe | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

// 风味标签映射
const flavorLabels: Record<keyof FlavorProfile, string> = {
  savory: '咸',
  sweet: '甜',
  sour: '酸',
  spicy: '辣',
  umami: '鲜',
  bitter: '苦'
}

const flavorColors: Record<keyof FlavorProfile, string> = {
  savory: '#FF6B6B',
  sweet: '#4ECDC4',
  sour: '#45B7D1',
  spicy: '#96CEB4',
  umami: '#FFEAA7',
  bitter: '#DDA0DD'
}

// 计算属性
const isFavorite = computed(() => {
  return recipe.value ? recipeStore.isFavorite(recipe.value.id) : false
})

// 方法
const goBack = () => {
  router.back()
}

const toggleFavorite = () => {
  if (recipe.value) {
    recipeStore.toggleFavorite(recipe.value)
  }
}

const getFlavorLabel = (key: string): string => {
  return flavorLabels[key as keyof FlavorProfile] || key
}

const getFlavorColor = (key: string): string => {
  return flavorColors[key as keyof FlavorProfile] || '#666'
}

// 加载菜谱数据
const loadRecipe = async () => {
  const recipeId = route.params.id as string
  
  if (!recipeId) {
    error.value = '菜谱ID无效'
    loading.value = false
    return
  }

  try {
    loading.value = true
    error.value = null
    
    // 先检查store中是否有这个菜谱
    const storeRecipe = recipeStore.historyRecipes.find(r => r.id === recipeId)
    
    if (storeRecipe) {
      recipe.value = storeRecipe
    } else {
      // 调用B同学的API获取菜谱详情
      const fetchedRecipe = await getRecipeByIdService(recipeId)
      
      if (fetchedRecipe) {
        recipe.value = fetchedRecipe
        // 添加到store的历史记录
        recipeStore.setCurrentRecipe(fetchedRecipe)
      } else {
        error.value = '未找到该菜谱'
      }
    }
  } catch (err) {
    console.error('加载菜谱失败:', err)
    error.value = '加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

// 生命周期
onMounted(() => {
  loadRecipe()
})

// 监听路由变化
import { watch } from 'vue'
watch(() => route.params.id, () => {
  loadRecipe()
})
</script>

<style scoped>
.detail-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f9f9f9 0%, #ffffff 100%);
  padding-bottom: 40px;
}

/* 头部样式 */
.detail-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 15px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 107, 107, 0.1);
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.05);
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: 1px solid rgba(255, 107, 107, 0.2);
  border-radius: 20px;
  padding: 8px 16px;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.back-btn:hover {
  background: linear-gradient(135deg, rgba(255, 107, 107, 0.1), rgba(255, 142, 83, 0.1));
  color: #ff6b6b;
  border-color: #ff6b6b;
  transform: translateX(-3px);
}

.page-title {
  font-size: 18px;
  color: #333;
  margin: 0;
  font-weight: 600;
}

.favorite-header-btn {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  font-size: 20px;
  transition: transform 0.3s;
}

.favorite-header-btn:hover {
  transform: scale(1.2);
}

.favorite-header-btn.active .favorite-icon {
  animation: heartBeat 0.5s ease;
}

@keyframes heartBeat {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.3); }
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 20px;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 107, 107, 0.1);
  border-top-color: #ff6b6b;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 错误状态 */
.error-state {
  text-align: center;
  padding: 100px 20px;
}

.error-icon {
  font-size: 60px;
  margin-bottom: 20px;
  opacity: 0.7;
}

.error-state h3 {
  color: #666;
  margin-bottom: 10px;
}

.error-state p {
  color: #999;
  margin-bottom: 30px;
}

.retry-btn {
  padding: 12px 30px;
  background: linear-gradient(135deg, #4ECDC4, #44A08D);
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
}

/* 菜谱内容 */
.detail-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
}

.recipe-hero {
  margin: 30px 0 40px;
  text-align: center;
}

.display-name {
  font-size: 32px;
  color: #333;
  margin: 0 0 10px 0;
  line-height: 1.3;
  background: linear-gradient(135deg, #FF6B6B, #FF8E53);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.original-name {
  font-size: 16px;
  color: #666;
  font-style: italic;
  margin: 0 0 20px 0;
}

.recipe-meta {
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(255, 107, 107, 0.05);
  border-radius: 20px;
  font-size: 14px;
  color: #666;
  border: 1px solid rgba(255, 107, 107, 0.1);
}

.meta-icon {
  font-size: 16px;
}

/* 通用区块样式 */
.section-title {
  font-size: 20px;
  color: #333;
  margin: 0 0 20px 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-icon {
  font-size: 22px;
}

.description-section,
.story-section,
.ingredients-section,
.steps-section,
.flavor-section,
.tips-section {
  margin-bottom: 40px;
  padding: 25px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(255, 107, 107, 0.05);
}

.description-text {
  font-size: 16px;
  color: #666;
  line-height: 1.7;
  margin: 0;
}

/* AI故事区域 */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.ai-badge {
  padding: 4px 12px;
  background: linear-gradient(135deg, #4ECDC4, #44A08D);
  color: white;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.story-content {
  position: relative;
  padding: 20px;
  background: linear-gradient(135deg, rgba(255, 249, 196, 0.3), rgba(255, 253, 231, 0.2));
  border-radius: 15px;
  border-left: 4px solid #FFD54F;
}

.quote-mark {
  position: absolute;
  font-size: 40px;
  color: rgba(255, 213, 79, 0.3);
  font-family: serif;
}

.quote-mark:first-child {
  top: -10px;
  left: 10px;
}

.quote-mark:last-child {
  bottom: -20px;
  right: 10px;
}

.story-content p {
  font-size: 15px;
  color: #5D4037;
  line-height: 1.8;
  font-style: italic;
  margin: 0;
  padding: 0 20px;
}

/* 食材列表 */
.ingredients-count {
  font-size: 14px;
  color: #999;
  font-weight: normal;
  margin-left: 8px;
}

.ingredients-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

.ingredient-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: linear-gradient(135deg, rgba(255, 107, 107, 0.05), rgba(255, 142, 83, 0.05));
  border-radius: 15px;
  border: 1px solid rgba(255, 107, 107, 0.1);
  animation: slideIn 0.5s ease var(--delay, 0s) backwards;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.check-icon {
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, #FF6B6B, #FF8E53);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.ingredient-name {
  font-size: 15px;
  color: #666;
  font-weight: 500;
}

/* 制作步骤 */
.steps-count {
  font-size: 14px;
  color: #999;
  font-weight: normal;
  margin-left: 8px;
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.step-item {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.step-number {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #FF6B6B, #FF8E53);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: bold;
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.2);
}

.step-content {
  flex: 1;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 12px;
  border-left: 3px solid #FF6B6B;
}

.step-content p {
  margin: 0;
  color: #666;
  line-height: 1.6;
  font-size: 15px;
}

/* 风味分析 */
.flavor-hint {
  text-align: center;
  padding: 20px;
  background: #f0f8ff;
  border-radius: 15px;
  border: 1px dashed #90caf9;
}

.flavor-hint p {
  color: #1976d2;
  margin-bottom: 20px;
}

.flavor-preview {
  max-width: 400px;
  margin: 0 auto;
}

.flavor-bar-item {
  margin-bottom: 15px;
}

.flavor-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.flavor-name {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.flavor-value {
  font-size: 12px;
  color: #666;
}

.bar-container {
  height: 8px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 1s ease;
}

/* 小贴士 */
.tips-content {
  padding: 20px;
  background: linear-gradient(135deg, rgba(233, 245, 255, 0.5), rgba(225, 245, 254, 0.3));
  border-radius: 15px;
  border-left: 4px solid #2196F3;
}

.tips-content p {
  color: #1976d2;
  line-height: 1.7;
  margin: 0;
  font-size: 15px;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 15px;
  margin-top: 40px;
  padding: 0 20px;
}

.primary-btn, .secondary-btn {
  flex: 1;
  padding: 16px;
  border: none;
  border-radius: 25px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.primary-btn {
  background: linear-gradient(135deg, #FF6B6B, #FF8E53);
  color: white;
  box-shadow: 0 8px 25px rgba(255, 107, 107, 0.2);
}

.primary-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 30px rgba(255, 107, 107, 0.3);
}

.secondary-btn {
  background: white;
  color: #666;
  border: 1px solid #ddd;
}

.secondary-btn:hover {
  background: #f9f9f9;
  border-color: #ff6b6b;
  color: #ff6b6b;
  transform: translateY(-2px);
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 100px 20px;
}

.empty-icon {
  font-size: 60px;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-state h3 {
  color: #666;
  margin-bottom: 10px;
}

.empty-state p {
  color: #999;
  margin-bottom: 30px;
}

.home-btn {
  padding: 12px 30px;
  background: linear-gradient(135deg, #4ECDC4, #44A08D);
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .detail-header {
    padding: 12px 15px;
  }
  
  .display-name {
    font-size: 24px;
  }
  
  .recipe-meta {
    gap: 10px;
  }
  
  .meta-item {
    padding: 6px 12px;
    font-size: 13px;
  }
  
  .description-section,
  .story-section,
  .ingredients-section,
  .steps-section,
  .flavor-section,
  .tips-section {
    padding: 20px;
    margin-bottom: 30px;
  }
  
  .ingredients-list {
    grid-template-columns: 1fr;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .step-item {
    gap: 15px;
  }
  
  .step-number {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }
}
</style>