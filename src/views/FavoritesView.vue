<template>
  <div class="favorites-container">
    <!-- 顶部导航栏 - 移除了清空按钮 -->
    <div class="header">
      <button @click="goBack" class="back-btn">
        <van-icon name="arrow-left" size="20" />
      </button>
      <h1>我的收藏</h1>
      <!-- 移除 header-actions 部分 -->
    </div>

    <!-- 收藏列表 -->
    <div v-if="favorites.length > 0" class="favorites-content">
      <!-- 收藏统计 -->
      <div class="favorites-stats">
        <div class="stat-item">
          <van-icon name="star" size="20" color="#FFD700" />
          <span class="stat-value">{{ favorites.length }}</span>
          <span class="stat-label">个收藏</span>
        </div>
        <div class="stat-item">
          <van-icon name="clock-o" size="20" color="#4CAF50" />
          <span class="stat-value">{{ totalCookingTime }}</span>
          <span class="stat-label">分钟总烹饪时间</span>
        </div>
      </div>

      <!-- 收藏筛选 -->
      <div class="filters-section">
        <div class="filter-tags">
          <button
            v-for="category in categories"
            :key="category"
            @click="toggleFilter(category)"
            :class="['filter-tag', { active: filters.includes(category) }]"
          >
            {{ category }}
          </button>
        </div>
        <div class="sort-options">
          <select v-model="sortBy" @change="sortFavorites" class="sort-select">
            <option value="time">按添加时间</option>
            <option value="name">按名称排序</option>
            <option value="difficulty">按难度排序</option>
            <option value="ingredients">按食材数量</option>
          </select>
        </div>
      </div>

      <!-- 收藏列表 -->
      <div class="favorites-list">
        <div
          v-for="recipe in filteredFavorites"
          :key="recipe.id"
          class="favorite-card"
          @click="goToDetail(recipe.id)"
        >
          <div class="card-header">
            <div class="recipe-info">
              <h3 class="recipe-name">{{ recipe.displayName }}</h3>
              <p class="original-name">{{ recipe.originalName }}</p>
            </div>
            <div class="card-actions">
              <button 
                @click.stop="toggleFavorite(recipe)"
                class="favorite-action-btn"
                :title="isFavorite(recipe.id) ? '取消收藏' : '收藏'"
              >
                <van-icon 
                  name="star" 
                  size="20" 
                  :color="isFavorite(recipe.id) ? '#FFD700' : '#CCCCCC'"
                />
              </button>
            </div>
          </div>

          <div class="card-content">
            <!-- 菜谱标签 -->
            <div class="recipe-tags">
              <span v-if="recipe.cookingTime" class="tag time-tag">
                <van-icon name="clock-o" size="12" />
                {{ recipe.cookingTime }}分钟
              </span>
              <span v-if="recipe.difficulty" :class="['tag', 'difficulty-tag', getDifficultyClass(recipe.difficulty)]">
                {{ recipe.difficulty }}
              </span>
              <span v-if="recipe.category" class="tag category-tag">
                {{ recipe.category[0] }}
              </span>
            </div>

            <!-- 食材预览 -->
            <div class="ingredients-preview">
              <div class="ingredients-label">主要食材：</div>
              <div class="ingredients-tags">
                <span 
                  v-for="(ingredient, index) in getIngredientsPreview(recipe.ingredients)"
                  :key="index"
                  class="ingredient-tag"
                >
                  {{ ingredient }}
                </span>
                <span v-if="recipe.ingredients.length > 3" class="more-ingredients">
                  +{{ recipe.ingredients.length - 3 }}种
                </span>
              </div>
            </div>

            <!-- 风味雷达图预览 -->
            <div class="flavor-preview" v-if="recipe.flavorProfile">
              <div class="flavor-label">风味特点：</div>
              <div class="flavor-bars">
                <div 
                  v-for="(value, key) in getTopFlavors(recipe.flavorProfile, 3)"
                  :key="key"
                  class="flavor-bar"
                >
                 <span class="flavor-name">{{ getFlavorLabel(String(key)) }}</span>
                  <div class="bar-container">
                    <div 
                      class="bar-fill" 
                      :style="{ width: `${(value / 5) * 100}%` }"
                      :class="`flavor-${key}`"
                    ></div>
                  </div>
                  <span class="flavor-value">{{ value }}/5</span>
                </div>
              </div>
            </div>
          </div>

          <div class="card-footer">
            <button class="view-detail-btn">
              查看完整做法
              <van-icon name="arrow" size="12" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-illustration">
        <van-icon name="star-o" size="80" color="#FFD700" class="star-icon" />
        <div class="sparkles">
          <div class="sparkle" v-for="n in 8" :key="n"></div>
        </div>
      </div>
      <h3 class="empty-title">还没有收藏的菜谱</h3>
      <p class="empty-description">
        当你发现喜欢的美食时，点击星星图标收藏它们吧！
      </p>
      <div class="empty-actions">
        <button @click="goHome" class="explore-btn">
          <van-icon name="search" size="16" />
          去发现美食
        </button>
        <button @click="showRandomRecipe" class="random-btn">
          <van-icon name="question-o" size="16" />
          随机推荐
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useRecipeStore } from '@/stores/recipe'
import { getRandomRecipe } from '@/services/recipeService'
import { showToast } from 'vant'
import type { Recipe, FlavorProfile } from '@/types/recipe'

const router = useRouter()
const recipeStore = useRecipeStore()

// 状态
const filters = ref<string[]>([])
const sortBy = ref<string>('time')

// 计算属性
const favorites = computed(() => recipeStore.favorites)

const hasFavorites = computed(() => favorites.value.length > 0)

const filteredFavorites = computed(() => {
  let result = [...favorites.value]

  // 应用筛选
  if (filters.value.length > 0) {
    result = result.filter(recipe => 
      recipe.category?.some(cat => filters.value.includes(cat))
    )
  }

  // 应用排序
  switch (sortBy.value) {
    case 'name':
      result.sort((a, b) => a.displayName.localeCompare(b.displayName))
      break
    case 'difficulty':
      const difficultyOrder = { '简单': 1, '中等': 2, '困难': 3 }
      result.sort((a, b) => 
        (difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 0) - 
        (difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 0)
      )
      break
    case 'ingredients':
      result.sort((a, b) => a.ingredients.length - b.ingredients.length)
      break
    // 默认按添加时间（后添加的在前）
    case 'time':
    default:
      // Pinia store中favorites按添加顺序存储，不需要额外排序
      break
  }

  return result
})

const categories = computed(() => {
  const allCategories = new Set<string>()
  favorites.value.forEach(recipe => {
    recipe.category?.forEach(cat => allCategories.add(cat))
  })
  return Array.from(allCategories)
})

const totalCookingTime = computed(() => {
  return favorites.value.reduce((total, recipe) => 
    total + (recipe.cookingTime || 0), 0
  )
})

// 方法
const goBack = () => {
  router.back()
}

const goHome = () => {
  router.push('/')
}

const goToDetail = (id: string) => {
  router.push(`/detail/${id}`)
}

const toggleFavorite = (recipe: Recipe) => {
  recipeStore.toggleFavorite(recipe)
  showToast(recipeStore.isFavorite(recipe.id) ? '已收藏' : '已取消收藏')
}

const isFavorite = (recipeId: string) => {
  return recipeStore.isFavorite(recipeId)
}

const toggleFilter = (category: string) => {
  const index = filters.value.indexOf(category)
  if (index > -1) {
    filters.value.splice(index, 1)
  } else {
    filters.value.push(category)
  }
}

const sortFavorites = () => {
  // 排序逻辑已经在computed中实现
  console.log('排序方式:', sortBy.value)
}

const getIngredientsPreview = (ingredients: string[]): string[] => {
  return ingredients.slice(0, 3)
}

const getTopFlavors = (flavorProfile: FlavorProfile, count: number) => {
  const entries = Object.entries(flavorProfile)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
  return Object.fromEntries(entries)
}

const getFlavorLabel = (key: string): string => {
  const labels: Record<string, string> = {
    savory: '咸',
    sweet: '甜',
    sour: '酸',
    spicy: '辣',
    umami: '鲜',
    bitter: '苦'
  }
  return labels[key] || key
}

const getDifficultyClass = (difficulty: string): string => {
  const classes: Record<string, string> = {
    '简单': 'easy',
    '中等': 'medium',
    '困难': 'hard'
  }
  return classes[difficulty] || 'medium'
}

const showRandomRecipe = async () => {
  try {
    const recipe = await getRandomRecipe()
    if (recipe) {
      recipeStore.setCurrentRecipe(recipe)
      goToDetail(recipe.id)
    }
  } catch (error) {
    console.error('获取随机菜谱失败:', error)
    showToast('获取推荐失败')
  }
}

// 生命周期
onMounted(() => {
  // 页面加载时恢复收藏状态
  recipeStore.loadFromLocalStorage()
})

// 监听收藏变化
watch(
  () => recipeStore.favorites.length,
  (newCount) => {
    if (newCount === 0) {
      // 如果清空了所有收藏，重置筛选和排序
      filters.value = []
      sortBy.value = 'time'
    }
  }
)
</script>

<style scoped lang="less">
@import '@/assets/styles/main.less';
.favorites-container {
  max-width: 800px;
  margin: 0 auto;
  min-height: 100vh;
  background: linear-gradient(135deg, #f9f9f9 0%, #f0f2f5 100%);
}

.header {
  position: sticky;
  top: 0;
  background: white;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 100;

  h1 {
    font-size: 18px;
    font-weight: 600;
    color: #333;
    margin: 0;
  }

  .back-btn {
    background: none;
    border: none;
    padding: 8px;
    cursor: pointer;
    border-radius: 50%;
    transition: background-color 0.3s;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background-color: rgba(0, 0, 0, 0.05);
    }
  }
  
  /* 移除 header-actions 样式 */
}

.favorites-content {
  padding: 20px;
}

.favorites-stats {
  display: flex;
  justify-content: space-around;
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;

    .stat-value {
      font-size: 28px;
      font-weight: bold;
      color: #333;
    }

    .stat-label {
      font-size: 14px;
      color: #666;
    }
  }
}

.filters-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 15px;

  .filter-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    flex: 1;

    .filter-tag {
      padding: 6px 16px;
      border: 2px solid #e0e0e0;
      border-radius: 20px;
      background: white;
      font-size: 14px;
      color: #666;
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        border-color: #ff6b6b;
        color: #ff6b6b;
      }

      &.active {
        background: linear-gradient(135deg, #ff6b6b, #ff8e53);
        border-color: #ff6b6b;
        color: white;
      }
    }
  }

  .sort-options {
    .sort-select {
      padding: 8px 16px;
      border: 2px solid #e0e0e0;
      border-radius: 10px;
      background: white;
      font-size: 14px;
      color: #666;
      cursor: pointer;
      outline: none;
      transition: border-color 0.3s;

      &:focus {
        border-color: #ff6b6b;
      }
    }
  }
}

.favorites-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.favorite-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);

    .view-detail-btn {
      transform: translateX(5px);
    }
  }

  .card-header {
    padding: 20px 20px 10px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;

    .recipe-info {
      flex: 1;

      .recipe-name {
        font-size: 18px;
        font-weight: 600;
        color: #333;
        margin: 0 0 5px 0;
        line-height: 1.3;
      }

      .original-name {
        font-size: 14px;
        color: #666;
        margin: 0;
        font-style: italic;
      }
    }

    .card-actions {
      .favorite-action-btn {
        background: none;
        border: none;
        padding: 8px;
        cursor: pointer;
        border-radius: 50%;
        transition: background-color 0.3s;

        &:hover {
          background-color: rgba(255, 215, 0, 0.1);
        }
      }
    }
  }

  .card-content {
    padding: 0 20px 15px;

    .recipe-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 15px;

      .tag {
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        display: inline-flex;
        align-items: center;
        gap: 4px;

        &.time-tag {
          background: #e3f2fd;
          color: #1976d2;
        }

        &.difficulty-tag {
          &.easy {
            background: #e8f5e9;
            color: #2e7d32;
          }
          &.medium {
            background: #fff3e0;
            color: #f57c00;
          }
          &.hard {
            background: #ffebee;
            color: #c62828;
          }
        }

        &.category-tag {
          background: #f3e5f5;
          color: #7b1fa2;
        }
      }
    }

    .ingredients-preview {
      margin-bottom: 15px;

      .ingredients-label {
        font-size: 14px;
        color: #999;
        margin-bottom: 8px;
      }

      .ingredients-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;

        .ingredient-tag {
          background: #f5f5f5;
          padding: 4px 10px;
          border-radius: 10px;
          font-size: 12px;
          color: #666;
        }

        .more-ingredients {
          font-size: 12px;
          color: #999;
          display: flex;
          align-items: center;
          padding: 4px 8px;
        }
      }
    }

    .flavor-preview {
      .flavor-label {
        font-size: 14px;
        color: #999;
        margin-bottom: 8px;
      }

      .flavor-bars {
        display: flex;
        flex-direction: column;
        gap: 6px;

        .flavor-bar {
          display: flex;
          align-items: center;
          gap: 10px;

          .flavor-name {
            width: 30px;
            font-size: 12px;
            color: #666;
          }

          .bar-container {
            flex: 1;
            height: 8px;
            background: #f0f0f0;
            border-radius: 4px;
            overflow: hidden;

            .bar-fill {
              height: 100%;
              border-radius: 4px;
              transition: width 0.6s ease;

              &.flavor-savory { background: #ff6b6b; }
              &.flavor-sweet { background: #4ecdc4; }
              &.flavor-sour { background: #45b7d1; }
              &.flavor-spicy { background: #96ceb4; }
              &.flavor-umami { background: #ffeaa7; }
              &.flavor-bitter { background: #dda0dd; }
            }
          }

          .flavor-value {
            width: 40px;
            font-size: 12px;
            color: #666;
            text-align: right;
          }
        }
      }
    }
  }

  .card-footer {
    padding: 15px 20px;
    border-top: 1px solid #f0f0f0;
    text-align: right;

    .view-detail-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: linear-gradient(135deg, #ff6b6b, #ff8e53);
      color: white;
      border: none;
      padding: 8px 20px;
      border-radius: 20px;
      font-size: 14px;
      cursor: pointer;
      transition: transform 0.3s;

      &:hover {
        transform: translateX(5px);
      }
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;

  .empty-illustration {
    position: relative;
    margin-bottom: 30px;

    .star-icon {
      animation: float 3s ease-in-out infinite;
    }

    .sparkles {
      position: absolute;
      top: -10px;
      left: -10px;
      right: -10px;
      bottom: -10px;

      .sparkle {
        position: absolute;
        width: 4px;
        height: 4px;
        background: #FFD700;
        border-radius: 50%;
        animation: sparkle 2s infinite;
      }
      
      // 简化版：只显示几个固定位置的sparkle
      .sparkle:nth-child(1) { left: 20%; top: 30%; animation-delay: 0s; }
      .sparkle:nth-child(2) { left: 70%; top: 60%; animation-delay: 0.5s; }
      .sparkle:nth-child(3) { left: 40%; top: 80%; animation-delay: 1s; }
      .sparkle:nth-child(4) { left: 80%; top: 20%; animation-delay: 1.5s; }
    }
  }

  .empty-title {
    font-size: 20px;
    color: #333;
    margin: 0 0 10px 0;
  }

  .empty-description {
    font-size: 14px;
    color: #666;
    margin: 0 0 30px 0;
    line-height: 1.6;
  }

  .empty-actions {
    display: flex;
    gap: 15px;

    .explore-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      background: linear-gradient(135deg, #ff6b6b, #ff8e53);
      color: white;
      border: none;
      border-radius: 25px;
      font-size: 14px;
      cursor: pointer;
      transition: transform 0.3s;

      &:hover {
        transform: translateY(-2px);
      }
    }

    .random-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      background: white;
      color: #666;
      border: 2px solid #e0e0e0;
      border-radius: 25px;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        border-color: #ff6b6b;
        color: #ff6b6b;
      }
    }
  }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes sparkle {
  0%, 100% { opacity: 0; transform: scale(0.5); }
  50% { opacity: 1; transform: scale(1); }
}

@media (max-width: 768px) {
  .header {
    padding: 16px 15px;
    
    h1 {
      font-size: 16px;
    }
  }

  .favorites-content {
    padding: 15px;
  }

  .favorites-stats {
    padding: 15px;
    
    .stat-item {
      .stat-value {
        font-size: 24px;
      }
    }
  }

  .filters-section {
    flex-direction: column;
    align-items: stretch;
    
    .sort-options {
      .sort-select {
        width: 100%;
      }
    }
  }

  .favorite-card {
    .card-header {
      padding: 15px 15px 10px;
    }
    
    .card-content {
      padding: 0 15px 15px;
    }
    
    .card-footer {
      padding: 12px 15px;
    }
  }

  .empty-actions {
    flex-direction: column;
    width: 100%;
    
    button {
      width: 100%;
    }
  }
}

@media (max-width: 480px) {
  .favorites-stats {
    flex-direction: column;
    gap: 20px;
  }
}
</style>