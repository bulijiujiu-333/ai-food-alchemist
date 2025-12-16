<!-- src/views/HomeView.vue -->
<template>
  <div class="home">
    <h1>🍳 AI美食炼金术师</h1>

    <!-- 顶部导航（如果需要） -->
    <div class="top-nav">
      <router-link to="/favorites" class="nav-link">
        <span>⭐ 我的收藏</span>
      </router-link>
    </div>

    <!-- 食材选择区域 -->
    <div class="ingredients-section">
      <h2>选择你的食材</h2>

      <div class="selected-count">
        已选择 {{ selectedIngredientsCount }} 种食材
        <button
          @click="clearAll"
          v-if="hasSelectedIngredients"
          class="clear-btn"
          :disabled="isLoading"
        >
          {{ isLoading ? '处理中...' : '清空' }}
        </button>
      </div>

      <div class="ingredients-grid">
        <button
          v-for="ingredient in availableIngredients"
          :key="ingredient"
          @click="toggleIngredient(ingredient)"
          :disabled="isLoading"
          :class="[
            'ingredient-tag',
            {
              'selected': isSelected(ingredient),
              'disabled': isLoading
            }
          ]"
        >
          {{ ingredient }}
        </button>
      </div>
    </div>

    <!-- 推荐按钮 -->
    <div class="recommend-section">
      <button
        @click="handleRecommend"
        :disabled="!hasSelectedIngredients || isLoading"
        :class="['recommend-btn', { 'loading': isLoading }]"
      >
        <span v-if="isLoading">✨ 炼金中...</span>
        <span v-else>✨ 开始炼金！</span>
      </button>
    </div>

    <!-- 推荐结果 -->
    <div v-if="currentRecipe" class="result-section">
      <h2>✨ 炼金成果 ✨</h2>
      <div class="recipe-card">
        <h3>{{ currentRecipe.displayName || currentRecipe.originalName }}</h3>
        <p class="description">{{ currentRecipe.description }}</p>

        <!-- AI生成的故事 -->
        <div v-if="currentRecipe.story" class="ai-story">
          <p>「{{ currentRecipe.story }}」</p>
        </div>

        <div class="ingredients">
          <strong>所需食材：</strong>
          <div class="ingredients-list">
            <span v-for="ing in currentRecipe.ingredients" :key="ing" class="ing-badge">
              {{ ing }}
            </span>
          </div>
        </div>

        <!-- 风味雷达图提示 -->
        <div v-if="currentRecipe.flavorProfile" class="flavor-hint">
          <small>🎯 风味分析数据已就绪，等待雷达图组件</small>
        </div>

        <div class="actions">
          <button @click="toggleFavorite(currentRecipe)" class="favorite-btn">
            {{ isFavorite(currentRecipe.id) ? '❤️ 已收藏' : '🤍 收藏' }}
          </button>
          <button @click="viewDetail(currentRecipe.id)" class="detail-btn">
            📖 查看详情
          </button>
        </div>
      </div>
    </div>

    <!-- 历史记录 -->
    <div v-if="historyRecipes.length > 0" class="history-section">
      <h3>📜 最近推荐</h3>
      <div class="history-list">
        <div
          v-for="recipe in historyRecipes.slice(0, 5)"
          :key="recipe.id"
          @click="viewDetail(recipe.id)"
          class="history-item"
        >
          {{ recipe.displayName || recipe.originalName }}
        </div>
      </div>
    </div>

    <!-- 底部信息 -->
    <div class="footer">
      <p>AI美食炼金术师 · 让每道菜都有魔法 ✨</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRecipeStore } from '@/stores/recipe'
// 导入B同学的数据
import { getAllIngredients } from '@/services/recipeService'

const router = useRouter()
const recipeStore = useRecipeStore()

// 可用食材列表
const availableIngredients = ref<string[]>([
  '鸡蛋', '西红柿', '土豆', '鸡肉', '牛肉',
  '猪肉', '鱼', '豆腐', '米饭', '面条',
  '青椒', '洋葱', '大蒜', '生姜', '香菇',
  '胡萝卜', '西兰花', '黄瓜', '菠菜', '玉米'
])

// 也可以使用B同学的数据（异步加载）
onMounted(() => {
  getAllIngredients().then(ingredients => {
    if (ingredients && ingredients.length > 0) {
      availableIngredients.value = ingredients.slice(0, 25) // 限制显示数量
    }
  }).catch(() => {
    // 使用默认列表
  })
})

// 计算属性
const selectedIngredientsCount = computed(() => recipeStore.selectedIngredientsCount)
const hasSelectedIngredients = computed(() => recipeStore.hasSelectedIngredients)
const isLoading = computed(() => recipeStore.isLoading)
const currentRecipe = computed(() => recipeStore.currentRecipe)
const historyRecipes = computed(() => recipeStore.historyRecipes)

// 方法
const toggleIngredient = (ingredient: string) => {
  if (!isLoading.value) {
    recipeStore.toggleIngredient(ingredient)
  }
}

const clearAll = () => {
  if (!isLoading.value) {
    recipeStore.clearIngredients()
  }
}

const isSelected = (ingredient: string) => {
  return recipeStore.selectedIngredients.includes(ingredient)
}

const isFavorite = (recipeId: string) => {
  return recipeStore.isFavorite(recipeId)
}

const toggleFavorite = (recipe: any) => {
  recipeStore.toggleFavorite(recipe)
}

// 核心：调用推荐方法
const handleRecommend = async () => {
  const recipe = await recipeStore.getRecommendation()
  if (recipe) {
    // 自动滚动到结果区域
    setTimeout(() => {
      const resultSection = document.querySelector('.result-section')
      if (resultSection) {
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 300)
  }
}

const viewDetail = (id: string) => {
  router.push(`/detail/${id}`)
}
</script>

<style scoped>
.home {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  min-height: 100vh;
}

.top-nav {
  text-align: right;
  margin-bottom: 20px;
}

.nav-link {
  text-decoration: none;
  color: #666;
  font-size: 14px;
  padding: 8px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  transition: all 0.3s;
}

.nav-link:hover {
  background: #f5f5f5;
  color: #ff6b6b;
}

h1 {
  color: #ff6b6b;
  text-align: center;
  margin: 20px 0 40px;
  font-size: 32px;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
}

.ingredients-section {
  background: white;
  border-radius: 20px;
  padding: 25px;
  margin-bottom: 30px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.08);
}

.ingredients-section h2 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 20px;
}

.selected-count {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  color: #666;
  font-size: 15px;
}

.clear-btn {
  padding: 6px 15px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 15px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.3s;
}

.clear-btn:hover:not(:disabled) {
  background: #ffebee;
  color: #d32f2f;
  border-color: #ffcdd2;
}

.clear-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ingredients-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
}

.ingredient-tag {
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 25px;
  background: white;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
  color: #666;
}

.ingredient-tag:hover:not(.disabled) {
  border-color: #ff6b6b;
  color: #ff6b6b;
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(255,107,107,0.1);
}

.ingredient-tag.selected {
  background: linear-gradient(135deg, #FF6B6B, #FF8E53);
  color: white;
  border-color: #ff6b6b;
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(255,107,107,0.25);
}

.ingredient-tag.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.recommend-section {
  text-align: center;
  margin: 40px 0;
}

.recommend-btn {
  padding: 18px 50px;
  background: linear-gradient(135deg, #FF6B6B, #FF8E53);
  color: white;
  border: none;
  border-radius: 40px;
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 10px 25px rgba(255,107,107,0.3);
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.recommend-btn:hover:not(:disabled) {
  transform: translateY(-4px);
  box-shadow: 0 15px 35px rgba(255,107,107,0.4);
}

.recommend-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.recommend-btn.loading {
  opacity: 0.8;
  cursor: wait;
}

.recommend-btn.loading::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% { left: -100%; }
  100% { left: 100%; }
}

.result-section {
  margin-top: 50px;
  animation: fadeIn 0.6s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

.result-section h2 {
  text-align: center;
  color: #333;
  margin-bottom: 25px;
  font-size: 24px;
}

.recipe-card {
  background: white;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 10px 35px rgba(0,0,0,0.1);
  border-top: 4px solid #ff6b6b;
}

.recipe-card h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 24px;
}

.description {
  color: #666;
  line-height: 1.6;
  margin-bottom: 20px;
  font-size: 16px;
}

.ai-story {
  background: linear-gradient(135deg, #fff9c4, #fffde7);
  border-radius: 15px;
  padding: 20px;
  margin: 25px 0;
  border-left: 5px solid #ffd54f;
  font-style: italic;
  color: #5d4037;
  line-height: 1.6;
  font-size: 15px;
}

.ingredients {
  margin: 25px 0;
}

.ingredients strong {
  display: block;
  margin-bottom: 15px;
  color: #333;
  font-size: 16px;
}

.ingredients-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.ing-badge {
  display: inline-block;
  background: #f0f0f0;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  color: #666;
  transition: all 0.3s;
}

.ing-badge:hover {
  background: #e0e0e0;
  transform: translateY(-2px);
}

.flavor-hint {
  background: #e3f2fd;
  border-radius: 15px;
  padding: 15px;
  margin: 25px 0;
  text-align: center;
  color: #1976d2;
  font-size: 14px;
  border: 1px dashed #90caf9;
}

.actions {
  display: flex;
  gap: 15px;
  margin-top: 30px;
}

.favorite-btn, .detail-btn {
  flex: 1;
  padding: 14px;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s;
}

.favorite-btn {
  background: #ffebee;
  color: #d32f2f;
}

.favorite-btn:hover {
  background: #ffcdd2;
  transform: translateY(-2px);
}

.detail-btn {
  background: linear-gradient(135deg, #4ECDC4, #44A08D);
  color: white;
}

.detail-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(78, 205, 196, 0.3);
}

.history-section {
  margin-top: 50px;
}

.history-section h3 {
  margin-bottom: 20px;
  color: #333;
  font-size: 20px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  padding: 15px 25px;
  background: white;
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 15px;
  color: #666;
  border: 1px solid #f0f0f0;
}

.history-item:hover {
  background: #f9f9f9;
  transform: translateX(10px);
  border-color: #ff6b6b;
  color: #ff6b6b;
}

.footer {
  margin-top: 60px;
  padding: 25px;
  text-align: center;
  color: #999;
  font-size: 14px;
  border-top: 1px solid #eee;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .home {
    padding: 15px;
  }

  h1 {
    font-size: 26px;
  }

  .ingredients-grid {
    grid-template-columns: repeat(auto-fill, minmax(85px, 1fr));
    gap: 10px;
  }

  .recommend-btn {
    padding: 16px 40px;
    font-size: 18px;
  }

  .recipe-card {
    padding: 20px;
  }

  .actions {
    flex-direction: column;
  }
}
</style>