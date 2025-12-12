// stores/recipe.ts - 准确集成版本
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
// ✅ 导入B同学的类型
import type { Recipe } from '@/types/recipe'
// ✅ 导入B同学的API服务
import { getRecipeRecommendation } from '@/services/recipeService'

export const useRecipeStore = defineStore('recipe', () => {
  // 状态 - 使用B同学的类型
  const selectedIngredients = ref<string[]>([])
  const currentRecipe = ref<Recipe | null>(null)  // ✅ 使用Recipe类型
  const isLoading = ref(false)
  const favorites = ref<Recipe[]>([])  // ✅ 使用Recipe类型
  const historyRecipes = ref<Recipe[]>([])  // ✅ 使用Recipe类型

  // 计算属性
  const hasSelectedIngredients = computed(() => {
    return selectedIngredients.value.length > 0
  })

  const selectedIngredientsCount = computed(() => {
    return selectedIngredients.value.length
  })

  // 方法
  const toggleIngredient = (ingredient: string) => {
    const index = selectedIngredients.value.indexOf(ingredient)
    if (index > -1) {
      selectedIngredients.value.splice(index, 1)
    } else {
      selectedIngredients.value.push(ingredient)
    }
  }

  const clearIngredients = () => {
    selectedIngredients.value = []
  }

  // ✅ 新增：调用B同学的推荐API
  const getRecommendation = async (): Promise<Recipe | null> => {
    if (selectedIngredients.value.length === 0) {
      console.warn('请先选择食材')
      return null
    }

    try {
      isLoading.value = true
      
      // ✅ 准确调用B同学的函数
      const recipe = await getRecipeRecommendation(selectedIngredients.value)
      
      if (!recipe) {
        console.warn('没有找到匹配的菜谱')
        return null
      }
      
      // 设置当前菜谱
      currentRecipe.value = recipe
      
      // 添加到历史记录
      historyRecipes.value.unshift(recipe)
      if (historyRecipes.value.length > 10) {
        historyRecipes.value.pop()
      }
      
      console.log('✅ 推荐成功:', recipe.displayName || recipe.originalName)
      return recipe
      
    } catch (error) {
      console.error('❌ 推荐失败:', error)
      
      // 降级方案：返回一个简单的模拟数据
      const fallbackRecipe: Recipe = {
        id: 'fallback-' + Date.now(),
        originalName: '备用菜谱',
        displayName: '备用菜谱',
        description: '请稍后重试或选择其他食材',
        ingredients: selectedIngredients.value,
        steps: ['请稍后重试'],
        flavorProfile: {
          savory: 3,
          sweet: 3,
          sour: 3,
          spicy: 3,
          umami: 3,
          bitter: 3
        }
      }
      
      currentRecipe.value = fallbackRecipe
      return fallbackRecipe
      
    } finally {
      isLoading.value = false
    }
  }

  const setCurrentRecipe = (recipe: Recipe) => {
    currentRecipe.value = recipe
    historyRecipes.value.unshift(recipe)
    if (historyRecipes.value.length > 10) {
      historyRecipes.value.pop()
    }
  }

  const toggleFavorite = (recipe: Recipe) => {
    const index = favorites.value.findIndex(r => r.id === recipe.id)
    if (index > -1) {
      favorites.value.splice(index, 1)
    } else {
      favorites.value.push(recipe)
    }
  }

  const isFavorite = (recipeId: string) => {
    return favorites.value.some(r => r.id === recipeId)
  }

  return {
    // 状态
    selectedIngredients,
    currentRecipe,
    isLoading,
    favorites,
    historyRecipes,
    
    // 计算属性
    hasSelectedIngredients,
    selectedIngredientsCount,
    
    // 方法
    toggleIngredient,
    clearIngredients,
    setCurrentRecipe,
    toggleFavorite,
    isFavorite,
    // ✅ 导出新增的方法
    getRecommendation
  }
})