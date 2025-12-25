// stores/recipe.ts
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
// 导入B同学的类型
import type { Recipe, FlavorProfile } from '@/types/recipe'
// 导入B同学的API服务
import { getRecipeRecommendation } from '@/services/recipeService'

export const useRecipeStore = defineStore('recipe', () => {
  // 状态 - 使用B同学的类型
  const selectedIngredients = ref<string[]>([])
  const currentRecipe = ref<Recipe | null>(null)
  const isLoading = ref(false)
  const favorites = ref<Recipe[]>([])
  const historyRecipes = ref<Recipe[]>([])

  // 从本地存储加载数据
  const loadFromLocalStorage = () => {
    try {
      const savedFavorites = localStorage.getItem('recipe_favorites')
      const savedHistory = localStorage.getItem('recipe_history')
      const savedSelected = localStorage.getItem('selected_ingredients')

      if (savedFavorites) {
        favorites.value = JSON.parse(savedFavorites)
      }
      if (savedHistory) {
        historyRecipes.value = JSON.parse(savedHistory)
      }
      if (savedSelected) {
        selectedIngredients.value = JSON.parse(savedSelected)
      }
    } catch (error) {
      console.error('加载本地存储失败:', error)
      // 清空本地存储中的无效数据
      localStorage.removeItem('recipe_favorites')
      localStorage.removeItem('recipe_history')
      localStorage.removeItem('selected_ingredients')
    }
  }

  // 保存数据到本地存储
  const saveToLocalStorage = () => {
    try {
      localStorage.setItem('recipe_favorites', JSON.stringify(favorites.value))
      localStorage.setItem('recipe_history', JSON.stringify(historyRecipes.value))
      localStorage.setItem('selected_ingredients', JSON.stringify(selectedIngredients.value))
    } catch (error) {
      console.error('保存到本地存储失败:', error)
    }
  }

  // 初始化时加载数据
  loadFromLocalStorage()

  // 监听状态变化自动保存
  watch(favorites, saveToLocalStorage, { deep: true })
  watch(historyRecipes, saveToLocalStorage, { deep: true })
  watch(selectedIngredients, saveToLocalStorage, { deep: true })

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

  // 推荐函数
  const getRecommendation = async (): Promise<Recipe | null> => {
    if (selectedIngredients.value.length === 0) {
      console.warn('请先选择食材')
      return null
    }

    try {
      isLoading.value = true

      // 调用B同学的API
      const recipe = await getRecipeRecommendation(selectedIngredients.value)

      if (!recipe) {
        console.warn('没有找到匹配的菜谱')

        // 使用更友好的降级方案
        const fallbackRecipe = createFallbackRecipe(selectedIngredients.value)
        currentRecipe.value = fallbackRecipe
        return fallbackRecipe
      }

      // 设置当前菜谱
      currentRecipe.value = recipe

      // 添加到历史记录（去重）
      const existingIndex = historyRecipes.value.findIndex(r => r.id === recipe.id)
      if (existingIndex > -1) {
        historyRecipes.value.splice(existingIndex, 1)
      }
      historyRecipes.value.unshift(recipe)

      // 只保留最近10条记录
      if (historyRecipes.value.length > 10) {
        historyRecipes.value.pop()
      }

      console.log('✅ 推荐成功:', recipe.displayName || recipe.originalName)
      return recipe

    } catch (error) {
      console.error('❌ 推荐失败:', error)

      // 使用降级方案
      const fallbackRecipe = createFallbackRecipe(selectedIngredients.value)
      currentRecipe.value = fallbackRecipe
      return fallbackRecipe

    } finally {
      isLoading.value = false
    }
  }

  // 创建降级菜谱的辅助函数
  const createFallbackRecipe = (ingredients: string[]): Recipe => {
    const timestamp = Date.now()
    const flavorProfile: FlavorProfile = {
      savory: 3,
      sweet: 3,
      sour: 3,
      spicy: 3,
      umami: 3,
      bitter: 3
    }

    return {
      id: `fallback-${timestamp}`,
      originalName: '创意搭配',
      displayName: '✨ 魔法创意菜',
      description: '基于您选择的食材生成的创意搭配，试试看吧！',
      ingredients: ingredients,
      steps: [
        '将所选食材洗净切好备用',
        '根据个人口味选择合适的烹饪方式',
        '尝试不同的调味组合',
        '发挥创意，创造属于你的独特美食！'
      ],
      flavorProfile,
      story: '这是一道由AI美食炼金术师为您特别创意的菜谱。虽然没有找到完全匹配的传统菜谱，但您选择的食材组合本身就充满了可能性！',
      cookingTime: 20,
      difficulty: '简单' as const,
      category: ['创意菜', '自定义']
    }
  }

  const setCurrentRecipe = (recipe: Recipe) => {
    currentRecipe.value = recipe

    // 添加到历史记录（去重）
    const existingIndex = historyRecipes.value.findIndex(r => r.id === recipe.id)
    if (existingIndex > -1) {
      historyRecipes.value.splice(existingIndex, 1)
    }
    historyRecipes.value.unshift(recipe)

    // 只保留最近10条
    if (historyRecipes.value.length > 10) {
      historyRecipes.value.pop()
    }

    saveToLocalStorage()
  }

  const toggleFavorite = (recipe: Recipe) => {
    const index = favorites.value.findIndex(r => r.id === recipe.id)
    if (index > -1) {
      favorites.value.splice(index, 1)
    } else {
      favorites.value.push(recipe)
    }
    saveToLocalStorage()
  }

  const isFavorite = (recipeId: string): boolean => {
    return favorites.value.some(r => r.id === recipeId)
  }

  // 清除所有数据
  const clearAllData = () => {
    selectedIngredients.value = []
    currentRecipe.value = null
    favorites.value = []
    historyRecipes.value = []

    localStorage.removeItem('recipe_favorites')
    localStorage.removeItem('recipe_history')
    localStorage.removeItem('selected_ingredients')
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
    getRecommendation,
    clearAllData,
    loadFromLocalStorage,
    saveToLocalStorage
  }
})