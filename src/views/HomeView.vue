<!-- src/views/HomeView.vue -->
<template>
  <div class="home">
    <h1>🍳 AI美食炼金术师</h1>

    <!-- 顶部导航 -->
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

      <!-- 加载状态提示 -->
      <div v-if="loadingIngredients" class="loading-hint">
        <div class="spinner"></div>
        <small>正在从魔法食材库中加载...</small>
      </div>

      <!-- 加载失败提示 -->
      <div v-if="loadError" class="error-hint">
        <small>⚠️ 食材库连接失败，使用本地食材列表</small>
      </div>

      <div class="ingredients-grid">
  <IngredientTag
    v-for="ingredient in availableIngredients"
    :key="ingredient"
    :ingredient="ingredient"
    :selected="isSelected(ingredient)"
    :disabled="isLoading || loadingIngredients"
    :size="'medium'"
    @click="toggleIngredient(ingredient)"
    class="custom-ingredient-tag"
  />
</div>
    </div>

    <!-- 推荐按钮 -->
    <div class="recommend-section">
      <PrimaryButton
  @click="handleRecommend"
  :loading="isLoading"
  :disabled="!hasSelectedIngredients"
  size="large"
  class="recommend-btn"
>
  <template #icon>
    ✨
  </template>
  开始炼金！
</PrimaryButton>

      <!-- 提示信息 -->
      <div v-if="!hasSelectedIngredients" class="hint-text">
        请先选择至少一种食材
      </div>
    </div>

    <!-- 推荐结果 -->
    <div v-if="currentRecipe" class="result-section">
      <h2>✨ 炼金成果 ✨</h2>

      <!-- 使用B同学的RecipeCard组件 -->
      <RecipeCard
        :recipe="currentRecipe"
        @click="viewDetail(currentRecipe.id)"
        class="recipe-card-wrapper"
      />

      <!-- 收藏提示 -->
      <div class="favorite-hint" v-if="!isFavorite(currentRecipe.id)">
        <small>💡 点击收藏按钮保存这个魔法配方</small>
      </div>
    </div>

    <!-- 推荐结果为空时 -->
    <div v-if="recommendationError" class="empty-result">
      <div class="empty-icon">🍳</div>
      <h3>炼金失败</h3>
      <p>没有找到匹配的菜谱，试试其他食材组合吧！</p>
      <button @click="clearAll" class="retry-btn">
        重新选择食材
      </button>
    </div>

    <!-- 历史记录 -->
    <div v-if="historyRecipes.length > 0" class="history-section">
      <h3> 最近推荐</h3>
      <div class="history-list">
        <div
          v-for="recipe in historyRecipes.slice(0, 5)"
          :key="recipe.id"
          @click="viewDetail(recipe.id)"
          class="history-item"
        >
          <span class="history-name">{{ recipe.displayName || recipe.originalName }}</span>
          <span class="history-ingredients">
            {{ recipe.ingredients.slice(0, 2).join('、') }}...
          </span>
          <span class="history-arrow">→</span>
        </div>
      </div>
    </div>

    <!-- 底部信息 -->
    <div class="footer">
      <p>AI美食炼金术师 · 让每道菜都有魔法 ✨</p>
      <p class="version">版本 v0.1.0 | 敬韩颖 × 周吉 × 褚文洁 联合打造</p>
    </div>

<!-- AI思考中的等待提示 -->
<div v-if="isAIThinking" class="ai-thinking-overlay">
  <div class="thinking-card">
    <div class="thinking-animation">
      <div class="chef-icon">👨‍🍳</div>
      <div class="steam">
        <div class="steam-dot s1"></div>
        <div class="steam-dot s2"></div>
        <div class="steam-dot s3"></div>
      </div>
    </div>

    <h3>AI大厨正在施展魔法...</h3>

    <div class="fun-fact">
      <p>💡 {{ currentFunFact }}</p>
    </div>

    <div class="loading-dots">
      <span>.</span>
      <span>.</span>
      <span>.</span>
    </div>

    <div class="ai-process">
      <div class="process-step">
        <span class="step-icon">🔍</span>
        <span>分析食材搭配</span>
      </div>
      <div class="process-step">
        <span class="step-icon">✨</span>
        <span>创造独特风味</span>
      </div>
      <div class="process-step">
        <span class="step-icon">📖</span>
        <span>编写美食故事</span>
      </div>
    </div>
  </div>
</div>

    <!-- 开盲盒动画组件 -->
<BoxOpeningAnimation
  v-if="showAnimation"
  :visible="showAnimation"
  :ingredients="animationIngredients"
  :resultRecipe="currentRecipe || undefined"
  @close="showAnimation = false"
  @animation-complete="handleAnimationComplete"
/>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRecipeStore } from '@/stores/recipe'
// 导入B同学的服务
import { getAllIngredients } from '@/services/recipeService'
// 导入B同学的RecipeCard组件
import RecipeCard from '@/components/RecipeCard.vue'
import BoxOpeningAnimation from '@/components/BoxOpeningAnimation.vue'
import PrimaryButton from '@/components/PrimaryButton.vue'
import IngredientTag from '@/components/IngredientTag.vue'

const router = useRouter()
const recipeStore = useRecipeStore()

const showAnimation = ref(false)
const animationIngredients = ref<string[]>([])

// 状态
const availableIngredients = ref<string[]>([])
const loadingIngredients = ref(true)
const loadError = ref(false)
const recommendationError = ref(false)

// 默认食材列表（备用）
const defaultIngredients = [
  '鸡蛋', '西红柿', '土豆', '鸡肉', '牛肉',
  '猪肉', '鱼', '豆腐', '米饭', '面条',
  '青椒', '洋葱', '大蒜', '生姜', '香菇',
  '胡萝卜', '西兰花', '黄瓜', '菠菜', '玉米'
]

// 趣味小知识数组
const funFacts = ref([
  "🍅 西红柿炒鸡蛋是最受欢迎的中式家常菜！",
  "🌶️ 青椒含有丰富的维生素C，是健康好选择",
  "🥚 鸡蛋的蛋白质吸收率高达98%",
  "🧂 好的调味能让简单食材变成美味佳肴",
  "🔥 火候掌握是中式烹饪的灵魂",
  "🔄 食材的新鲜度直接影响菜品质量",
  "🌈 色彩搭配也能影响食欲哦",
  "💧 少油少盐，健康饮食从今天开始",
  "⏰ 炖煮时间越长，风味越浓郁",
  "🧄 大蒜不仅能调味，还能杀菌",
  "🥘 砂锅保温效果好，适合炖菜",
  "🥗 蔬菜不宜过度烹饪以保留营养",
  "🍲 汤要趁热喝，味道最鲜美",
  "👨‍🍳 大厨的秘密：用心做的菜最好吃"
])

const currentFunFact = ref('')
const isAIThinking = ref(false)

// 切换小知识
const rotateFunFact = () => {
  const index = Math.floor(Math.random() * funFacts.value.length)
  currentFunFact.value = funFacts.value[index]!
  // 使用非空断言运算符!告诉TypeScript这不会是undefined
}

// 在组件挂载时开始轮播
onMounted(() => {
  rotateFunFact() // 先显示一个
  setInterval(rotateFunFact, 3000) // 每3秒切换
})

// 加载B同学的食材数据
onMounted(async () => {
  try {
    loadingIngredients.value = true
    loadError.value = false

    // 调用B同学的API
    const ingredients = await getAllIngredients()

    if (ingredients && ingredients.length > 0) {
      // 去重并排序
      const uniqueIngredients = Array.from(new Set(ingredients))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, 'zh-CN'))
        .slice(0, 30) // 限制显示数量

      availableIngredients.value = uniqueIngredients
    } else {
      // 如果返回空数组，使用默认列表
      throw new Error('食材列表为空')
    }
  } catch (error) {
    console.warn('加载食材列表失败，使用默认列表:', error)
    loadError.value = true
    availableIngredients.value = defaultIngredients
  } finally {
    loadingIngredients.value = false
  }
})

// 计算属性
const selectedIngredientsCount = computed(() => recipeStore.selectedIngredientsCount)
const hasSelectedIngredients = computed(() => recipeStore.hasSelectedIngredients)
const isLoading = computed(() => recipeStore.isLoading)
const currentRecipe = computed(() => recipeStore.currentRecipe)
const historyRecipes = computed(() => recipeStore.historyRecipes)

// 方法
const toggleIngredient = (ingredient: string) => {
  if (!isLoading.value && !loadingIngredients.value) {
    recipeStore.toggleIngredient(ingredient)
    recommendationError.value = false // 清空错误状态
  }
}

const clearAll = () => {
  if (!isLoading.value) {
    recipeStore.clearIngredients()
    recommendationError.value = false
  }
}

const isSelected = (ingredient: string) => {
  return recipeStore.selectedIngredients.includes(ingredient)
}

const isFavorite = (recipeId: string) => {
  return recipeStore.isFavorite(recipeId)
}

// 调用推荐方法
const handleRecommend = async () => {
  if (!hasSelectedIngredients.value) return

  try {
    // 1. 显示等待提示
    isAIThinking.value = true

    // 2. 先调用AI获取结果（不显示动画）
    recipeStore.isLoading = true

    // 给用户一点时间看到提示
    await new Promise(resolve => setTimeout(resolve, 300))
    //调用store层推荐接口，获取AI菜谱结果
    const recipe = await recipeStore.getRecommendation()

    if (!recipe) {
      showToast('没有找到匹配的菜谱，请尝试其他食材组合')
      isAIThinking.value = false
      return
    }

    // 3. 设置菜谱到store
    recipeStore.setCurrentRecipe(recipe)

    // 4. 隐藏等待提示，显示动画
    isAIThinking.value = false

    // 5. 保存食材并显示动画
    animationIngredients.value = [...recipeStore.selectedIngredients]
    showAnimation.value = true

  } catch (error) {
    console.error('推荐失败:', error)
    showToast('炼金失败，请稍后重试')
    isAIThinking.value = false
  } finally {
    recipeStore.isLoading = false
  }
}

const showToast = (message: string, duration = 2000) => {
  // 创建Toast元素
  const toast = document.createElement('div')
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    padding: 8px 16px;
    background: rgba(0,0,0,0.7);
    color: white;
    border-radius: 4px;
    z-index: 9999;
    font-size: 14px;
  `
  toast.textContent = message
  document.body.appendChild(toast)

  // 自动关闭
  setTimeout(() => {
    toast.remove()
  }, duration)
}

const handleAnimationComplete = () => {
  // 动画完成后滚动到结果
  setTimeout(() => {
    const resultSection = document.querySelector('.result-section')
    if (resultSection) {
      resultSection.scrollIntoView({ behavior: 'smooth' })
    }
  }, 500)
}

const viewDetail = (id: string) => {
  router.push(`/detail/${id}`)
}
</script>

<style scoped>
.home {
  padding: 20px;
  max-width: 900px;
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
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.nav-link:hover {
  background: linear-gradient(135deg, rgba(255, 107, 107, 0.1), rgba(255, 142, 83, 0.1));
  color: #ff6b6b;
  border-color: #ff6b6b;
}

h1 {
  color: #ff6b6b;
  text-align: center;
  margin: 20px 0 40px;
  font-size: 36px;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
  background: linear-gradient(135deg, #FF6B6B, #FF8E53);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.ingredients-section {
  background: white;
  border-radius: 24px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow:
    0 10px 40px rgba(0,0,0,0.08),
    inset 0 1px 0 rgba(255,255,255,0.5);
  border: 1px solid rgba(255, 107, 107, 0.1);
}

.ingredients-section h2 {
  margin: 0 0 25px 0;
  color: #333;
  font-size: 22px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.ingredients-section h2::before {
  content: '🥬';
  font-size: 24px;
}

.selected-count {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  color: #666;
  font-size: 15px;
  padding: 12px 18px;
  background: linear-gradient(135deg, rgba(255, 107, 107, 0.05), rgba(255, 142, 83, 0.05));
  border-radius: 15px;
  border: 1px dashed rgba(255, 107, 107, 0.3);
}

.clear-btn {
  padding: 8px 18px;
  background: white;
  border: 1px solid #ff6b6b;
  border-radius: 18px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: #ff6b6b;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.clear-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #ff6b6b, #ff8e53);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.2);
}

.clear-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f5f5f5;
  border-color: #ddd;
  color: #999;
}

.loading-hint {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 20px 0;
  padding: 15px;
  background: rgba(33, 150, 243, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(33, 150, 243, 0.1);
}

.loading-hint .spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(33, 150, 243, 0.2);
  border-top-color: #2196F3;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.error-hint {
  margin: 20px 0;
  padding: 15px;
  background: linear-gradient(135deg, rgba(255, 193, 7, 0.05), rgba(255, 152, 0, 0.05));
  border-radius: 12px;
  border: 1px solid rgba(255, 193, 7, 0.2);
  color: #FF9800;
  font-size: 13px;
  text-align: center;
}

.ingredients-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 15px;
}

/* ============ 新增：为自定义组件添加样式 ============ */
/* 给组件容器设置宽度 */
.custom-ingredient-tag {
  width: 100%;
  display: block;
}

/* 穿透到组件内部的按钮元素 */
.custom-ingredient-tag :deep(.ingredient-tag) {
  padding: 14px 8px;
  border: 2px solid #e0e0e0;
  border-radius: 25px;
  background: white;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  font-size: 14px;
  color: #666;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  position: relative;
  overflow: hidden;
  width: 100%;
}

.custom-ingredient-tag :deep(.ingredient-tag::before) {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 107, 107, 0.1), rgba(255, 142, 83, 0.1));
  opacity: 0;
  transition: opacity 0.3s;
}

.custom-ingredient-tag :deep(.ingredient-tag:hover:not(.disabled)) {
  border-color: #ff6b6b;
  color: #ff6b6b;
  transform: translateY(-4px) scale(1.05);
  box-shadow:
    0 8px 20px rgba(255, 107, 107, 0.15),
    0 4px 8px rgba(0, 0, 0, 0.05);
}

.custom-ingredient-tag :deep(.ingredient-tag:hover:not(.disabled)::before) {
  opacity: 1;
}

.custom-ingredient-tag :deep(.ingredient-tag.selected) {
  background: linear-gradient(135deg, #FF6B6B, #FF8E53);
  color: white;
  border-color: #ff6b6b;
  transform: translateY(-4px) scale(1.05);
  box-shadow:
    0 12px 30px rgba(255, 107, 107, 0.25),
    0 6px 15px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  animation: selectPulse 0.6s ease;
}

.custom-ingredient-tag :deep(.ingredient-tag.selected .selected-icon) {
  font-size: 16px;
  font-weight: bold;
  animation: iconPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.custom-ingredient-tag :deep(.ingredient-tag.disabled) {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

/* ============ 新增结束 ============ */



.ingredient-tag {
  padding: 14px 8px;
  border: 2px solid #e0e0e0;
  border-radius: 25px;
  background: white;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  font-size: 14px;
  color: #666;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  position: relative;
  overflow: hidden;
}

.ingredient-tag::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 107, 107, 0.1), rgba(255, 142, 83, 0.1));
  opacity: 0;
  transition: opacity 0.3s;
}

.ingredient-tag:hover:not(.disabled) {
  border-color: #ff6b6b;
  color: #ff6b6b;
  transform: translateY(-4px) scale(1.05);
  box-shadow:
    0 8px 20px rgba(255, 107, 107, 0.15),
    0 4px 8px rgba(0, 0, 0, 0.05);
}

.ingredient-tag:hover:not(.disabled)::before {
  opacity: 1;
}

.ingredient-tag.selected {
  background: linear-gradient(135deg, #FF6B6B, #FF8E53);
  color: white;
  border-color: #ff6b6b;
  transform: translateY(-4px) scale(1.05);
  box-shadow:
    0 12px 30px rgba(255, 107, 107, 0.25),
    0 6px 15px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  animation: selectPulse 0.6s ease;
}

.ingredient-tag.selected .selected-icon {
  font-size: 16px;
  font-weight: bold;
  animation: iconPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.ingredient-tag.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

@keyframes selectPulse {
  0%, 100% { transform: translateY(-4px) scale(1.05); }
  50% { transform: translateY(-4px) scale(1.1); }
}

@keyframes iconPop {
  0% { transform: scale(0); }
  70% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.recommend-section {
  text-align: center;
  margin: 50px 0;
  position: relative;
}

.recommend-btn {
  padding: 22px 60px;
  background: linear-gradient(135deg, #FF6B6B, #FF8E53);
  color: white;
  border: none;
  border-radius: 50px;
  font-size: 22px;
  font-weight: bold;
  cursor: pointer;
  box-shadow:
    0 15px 35px rgba(255, 107, 107, 0.3),
    0 5px 15px rgba(0, 0, 0, 0.1);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  gap: 12px;
}

.recommend-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.7s;
}

.recommend-btn:hover:not(:disabled)::before {
  left: 100%;
}

.recommend-btn:hover:not(:disabled) {
  transform: translateY(-6px) scale(1.05);
  box-shadow:
    0 25px 50px rgba(255, 107, 107, 0.4),
    0 10px 20px rgba(0, 0, 0, 0.15);
}

.recommend-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
  box-shadow:
    0 5px 15px rgba(0, 0, 0, 0.1) !important;
}

.recommend-btn.loading {
  opacity: 0.8;
  cursor: wait;
  padding-left: 50px;
  padding-right: 50px;
}

.recommend-btn.pulse-animation {
  animation: buttonPulse 2s infinite;
}

.spinner-small {
  width: 18px;
  height: 18px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.sparkle {
  display: inline-block;
  animation: sparkle 1.5s infinite;
  filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.8));
}

.hint-text {
  margin-top: 15px;
  color: #666;
  font-size: 14px;
  animation: fadeIn 0.5s ease;
}

@keyframes buttonPulse {
  0%, 100% {
    box-shadow:
      0 15px 35px rgba(255, 107, 107, 0.3),
      0 5px 15px rgba(0, 0, 0, 0.1);
  }
  50% {
    box-shadow:
      0 20px 45px rgba(255, 107, 107, 0.4),
      0 8px 20px rgba(0, 0, 0, 0.15),
      0 0 30px rgba(255, 107, 107, 0.2);
  }
}

@keyframes sparkle {
  0%, 100% { opacity: 0.5; transform: scale(0.9); }
  50% { opacity: 1; transform: scale(1.1); }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.result-section {
  margin-top: 60px;
  animation: slideUp 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(40px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.result-section h2 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
  font-size: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
}

.result-section h2::before,
.result-section h2::after {
  content: '✨';
  font-size: 24px;
  animation: twinkle 2s infinite;
}

@keyframes twinkle {
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.1); }
}

.recipe-card-wrapper {
  margin: 0 auto;
  max-width: 600px;
  transition: all 0.4s ease;
}

.recipe-card-wrapper:hover {
  transform: translateY(-5px);
}

.favorite-hint {
  text-align: center;
  margin-top: 20px;
  padding: 15px;
  background: linear-gradient(135deg, rgba(255, 193, 7, 0.05), rgba(255, 152, 0, 0.05));
  border-radius: 15px;
  border: 1px dashed rgba(255, 193, 7, 0.3);
  color: #FF9800;
  font-size: 14px;
  animation: fadeIn 0.8s ease;
}

.empty-result {
  text-align: center;
  padding: 50px 20px;
  margin-top: 40px;
  background: linear-gradient(135deg, rgba(249, 249, 249, 0.8), rgba(245, 245, 245, 0.9));
  border-radius: 20px;
  border: 2px dashed #ddd;
  animation: fadeIn 0.6s ease;
}

.empty-icon {
  font-size: 60px;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-result h3 {
  color: #666;
  margin-bottom: 10px;
}

.empty-result p {
  color: #999;
  margin-bottom: 25px;
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
  transition: all 0.3s;
}

.retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(78, 205, 196, 0.3);
}

.history-section {
  margin-top: 60px;
  animation: fadeIn 0.8s ease 0.2s backwards;
}

.history-section h3 {
  margin-bottom: 25px;
  color: #333;
  font-size: 22px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.history-section h3::before {
  content: '📜';
  font-size: 24px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  padding: 18px 25px;
  background: white;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  font-size: 15px;
  color: #666;
  border: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
}

.history-item:hover {
  background: linear-gradient(135deg, rgba(255, 107, 107, 0.05), rgba(255, 142, 83, 0.05));
  transform: translateX(12px) translateY(-2px);
  border-color: #ff6b6b;
  color: #ff6b6b;
  box-shadow:
    0 8px 25px rgba(255, 107, 107, 0.1),
    0 4px 12px rgba(0, 0, 0, 0.05);
}

.history-name {
  font-weight: 500;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-ingredients {
  font-size: 13px;
  color: #999;
  opacity: 0.8;
  white-space: nowrap;
}

.history-arrow {
  color: #ccc;
  font-size: 18px;
  transition: all 0.3s;
}

.history-item:hover .history-arrow {
  color: #ff6b6b;
  transform: translateX(5px);
}

.footer {
  margin-top: 80px;
  padding: 30px;
  text-align: center;
  color: #999;
  font-size: 14px;
  border-top: 1px solid #eee;
}

.version {
  font-size: 12px;
  color: #ccc;
  margin-top: 10px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .home {
    padding: 15px;
  }

  h1 {
    font-size: 28px;
  }

  .ingredients-section {
    padding: 20px;
    border-radius: 20px;
  }

  .ingredients-grid {
    grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
    gap: 12px;
  }

  .recommend-btn {
    padding: 18px 40px;
    font-size: 18px;
    width: 100%;
    max-width: 300px;
  }

  .recipe-card-wrapper {
    max-width: 100%;
  }

  .history-item {
    padding: 15px 20px;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .history-ingredients {
    align-self: flex-start;
  }

  .history-arrow {
    position: absolute;
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
  }

  .history-item:hover {
    transform: translateY(-2px);
  }
}

/* 打印样式 */
@media print {
  .recommend-section,
  .top-nav,
  .footer {
    display: none;
  }

  .ingredients-section {
    break-inside: avoid;
  }
}

/* AI思考中的等待提示样式 */
.ai-thinking-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.2); /* 很淡的半透明白色 */
  backdrop-filter: blur(4px); /* 轻微模糊背景 */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9998;
  animation: fadeIn 0.3s ease;
}

.thinking-card {
  background: rgba(255, 255, 255, 0.98); /* 卡片本身比较实 */
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 40px;
  max-width: 400px;
  width: 90%;
  text-align: center;
  box-shadow:
    0 20px 60px rgba(255, 107, 107, 0.15),
    0 8px 25px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 107, 107, 0.1);
  animation: slideUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.thinking-animation {
  position: relative;
  margin: 0 auto 30px;
  width: 100px;
  height: 100px;
}

.chef-icon {
  font-size: 60px;
  animation: bounce 2s infinite;
}

.steam {
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 40px;
}

.steam-dot {
  position: absolute;
  width: 8px;
  height: 8px;
  background: rgba(255, 107, 107, 0.3);
  border-radius: 50%;
}

.steam-dot.s1 {
  left: 10px;
  animation: steamFloat 1.5s infinite ease-in-out;
}

.steam-dot.s2 {
  left: 26px;
  animation: steamFloat 1.5s infinite ease-in-out 0.2s;
}

.steam-dot.s3 {
  left: 42px;
  animation: steamFloat 1.5s infinite ease-in-out 0.4s;
}

h3 {
  color: #333;
  margin-bottom: 20px;
  font-size: 22px;
  background: linear-gradient(135deg, #FF6B6B, #FF8E53);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.fun-fact {
  background: linear-gradient(135deg, rgba(255, 249, 196, 0.5), rgba(255, 253, 231, 0.3));
  border-radius: 16px;
  padding: 16px;
  margin: 20px 0;
  border-left: 4px solid #FFD54F;
}

.fun-fact p {
  color: #5D4037;
  margin: 0;
  font-size: 15px;
  line-height: 1.5;
  animation: fadeIn 0.8s ease;
}

.loading-dots {
  margin: 20px 0;
  font-size: 24px;
  color: #FF6B6B;
}

.loading-dots span {
  animation: dotBlink 1.4s infinite;
  margin: 0 2px;
}

.loading-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.loading-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

.ai-process {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 25px;
}

.process-step {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: rgba(255, 107, 107, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 107, 107, 0.1);
  font-size: 14px;
  color: #666;
  animation: stepAppear 0.3s ease backwards;
}

.process-step:nth-child(1) { animation-delay: 0.1s; }
.process-step:nth-child(2) { animation-delay: 0.3s; }
.process-step:nth-child(3) { animation-delay: 0.5s; }

.step-icon {
  font-size: 18px;
  opacity: 0.8;
}

/* 动画关键帧 */
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes steamFloat {
  0% { transform: translateY(0) scale(1); opacity: 0.3; }
  50% { transform: translateY(-15px) scale(1.2); opacity: 0.6; }
  100% { transform: translateY(-30px) scale(0.8); opacity: 0; }
}

@keyframes dotBlink {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 1; }
}

@keyframes stepAppear {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .thinking-card {
    padding: 30px 20px;
    width: 85%;
  }

  h3 {
    font-size: 18px;
  }

  .fun-fact p {
    font-size: 14px;
  }

  .process-step {
    font-size: 13px;
    padding: 8px 12px;
  }
}
</style>