import { recipes } from '@/data/recipes'
import type { Recipe, UserPreferences, FlavorProfile } from '@/types/recipe'
import { generateCreativeName, generateFlavorStory } from '@/services/aiService'

export type GetAllIngredientsResponse = string[]

// ==================== 类型定义 ====================
interface AIEnhancementResult {
  displayName: string
  story: string
  flavorProfile?: FlavorProfile
}

// ==================== 默认用户偏好 ====================
const getDefaultPreferences = (): UserPreferences => ({
  flavorPreferences: {
    savory: 3, sweet: 3, sour: 3, umami: 4, spicy: 2, bitter: 1
  },
  preferredCookingTime: 30,
  preferredDifficulty: '中等'
})

// ==================== AI增强函数 ====================
const enhanceRecipeWithAI = async (
  recipe: Recipe,
  selectedIngredients: string[]
): Promise<AIEnhancementResult> => {
  try {
    const [creativeName, flavorStory] = await Promise.all([
      generateCreativeName(recipe, selectedIngredients),
      generateFlavorStory(recipe, selectedIngredients)
    ])

    return {
      displayName: creativeName || recipe.originalName,
      story: flavorStory || '',
      flavorProfile: recipe.flavorProfile
    }
  } catch (error) {
    console.warn('AI服务暂时不可用:', error)
    return {
      displayName: recipe.originalName,
      story: '',
      flavorProfile: recipe.flavorProfile
    }
  }
}

// ==================== 智能匹配算法 ====================
const calculateAIMatchScore = (
  recipe: Recipe,
  userPreferences: UserPreferences
): number => {
  let totalScore = 0.5 // 基础分

  try {
    // 1. 风味匹配 (如果有风味数据)
    if (recipe.flavorProfile && userPreferences.flavorPreferences) {
      const flavorScore = calculateFlavorMatch(recipe.flavorProfile, userPreferences.flavorPreferences)
      totalScore = totalScore * 0.3 + flavorScore * 0.7
    }

    // 2. 烹饪时间匹配
    if (userPreferences.preferredCookingTime && recipe.cookingTime) {
      const timeDiff = Math.abs(recipe.cookingTime - userPreferences.preferredCookingTime)
      const timeScore = Math.max(0.3, 1 - timeDiff / 60)
      totalScore = totalScore * 0.7 + timeScore * 0.3
    }

    // 3. 难度匹配
    if (userPreferences.preferredDifficulty && recipe.difficulty) {
      const difficultyMatch = userPreferences.preferredDifficulty === recipe.difficulty ? 1 : 0.7
      totalScore = totalScore * 0.7 + difficultyMatch * 0.3
    }

    return Math.min(Math.max(totalScore, 0), 1)
  } catch (error) {
    console.warn('AI匹配计算失败，使用基础分数:', error)
    return 0.5
  }
}

// 风味匹配计算
const calculateFlavorMatch = (
  recipeFlavor: FlavorProfile,
  userFlavor: Partial<FlavorProfile>
): number => {
  const flavors: (keyof FlavorProfile)[] = ['savory', 'sweet', 'sour', 'spicy', 'umami', 'bitter']
  let match = 0
  let count = 0

  flavors.forEach(flavor => {
    const recipeValue = recipeFlavor[flavor] || 0
    const userValue = userFlavor[flavor] || 0
    if (userValue > 0) { // 只计算用户有偏好的风味
      const diff = Math.abs(recipeValue - userValue)
      match += (5 - diff) / 5  // 差异越小，分数越高
      count++
    }
  })

  return count > 0 ? match / count : 0.5
}

// ==================== 基础匹配算法（原有逻辑） ====================
const calculateBasicMatchScore = (recipe: Recipe, selectedIngredients: string[]): number => {
  let score = 0.5

  // 烹饪时间加分
  if (recipe.cookingTime && recipe.cookingTime < 30) {
    score += 0.2
  }

  // 难度加分
  if (recipe.difficulty === '简单') {
    score += 0.3
  }

  return Math.min(score, 1.0)
}

// ==================== 智能推荐主函数 ====================
export const getRecipeRecommendation = async (
  // 🎯 智能参数：支持两种调用方式
  arg1: string[] | UserPreferences,
  arg2?: string[]
): Promise<Recipe | null> => {

  // 1. 智能解析参数
  let selectedIngredients: string[]
  let userPreferences: UserPreferences

  if (Array.isArray(arg1)) {
    // 调用方式1：getRecipeRecommendation(['鸡蛋', '西红柿']) ← A同学现在的用法
    selectedIngredients = arg1
    userPreferences = getDefaultPreferences()
    console.log('🔧 使用兼容模式：仅传食材')
  } else {
    // 调用方式2：getRecipeRecommendation(preferences, ['鸡蛋', '西红柿']) ← 高级用法
    userPreferences = arg1
    selectedIngredients = arg2 || []
    console.log('🤖 使用高级模式：自定义用户偏好')
  }

  // 2. 参数验证
  if (!selectedIngredients || selectedIngredients.length === 0) {
    console.warn('⚠️ 没有提供食材，无法推荐')
    return null
  }

  // 3. 过滤匹配的菜谱（原有逻辑不变）
  const matchingRecipes = recipes.filter(recipe => {
    if (!recipe.ingredients) return false

    const recipeIngredients = recipe.ingredients.map(ing => ing.toLowerCase())
    const selected = selectedIngredients.map(i => i.toLowerCase())

    return selected.some(ingredient =>
      recipeIngredients.some(ri => ri.includes(ingredient) || ingredient.includes(ri))
    )
  })

  if (matchingRecipes.length === 0) {
    console.log('🔍 没有找到匹配的菜谱')
    return null
  }

  console.log(`🔍 找到 ${matchingRecipes.length} 个匹配菜谱`)

  // 4. 根据是否提供详细偏好，选择不同的评分算法
  const useDetailedPreferences = !Array.isArray(arg1) // 如果是方式2调用，使用AI算法

  const scoredRecipes = matchingRecipes.map(recipe => ({
    recipe,
    score: useDetailedPreferences
      ? calculateAIMatchScore(recipe, userPreferences)
      : calculateBasicMatchScore(recipe, selectedIngredients)
  }))

  // 5. 按分数排序
  scoredRecipes.sort((a, b) => b.score - a.score)

  // 6. 选择分数最高的菜谱（或随机选择前3名中的1个）
  const topRecipes = scoredRecipes.slice(0, 3)

  // ✅ 修复：添加空值检查
  if (topRecipes.length === 0) {
    return null
  }

  const randomIndex = Math.floor(Math.random() * topRecipes.length)
  const selectedScoredRecipe = topRecipes[randomIndex]

  // ✅ 双重安全检查
  if (!selectedScoredRecipe || !selectedScoredRecipe.recipe) {
    return null
  }

  const selectedRecipe = selectedScoredRecipe.recipe

  // 7. 调用AI生成创意名称和故事
  try {
    const aiResponse = await enhanceRecipeWithAI(selectedRecipe, selectedIngredients)

    const enhancedRecipe: Recipe = {
      ...selectedRecipe,
      displayName: aiResponse.displayName || selectedRecipe.originalName,
      story: aiResponse.story,
      flavorProfile: aiResponse.flavorProfile || selectedRecipe.flavorProfile,
      // ✅ 新增字段
      matchScore: selectedScoredRecipe.score,
      aiEnhanced: true,
      recommendationReason: generateRecommendationReason(selectedRecipe, selectedScoredRecipe.score, useDetailedPreferences)
    }

    console.log(`🎯 推荐成功: ${enhancedRecipe.displayName} (匹配度: ${(selectedScoredRecipe.score * 100).toFixed(1)}%)`)
    return enhancedRecipe
  } catch (error) {
    console.warn('AI增强失败，使用原始菜谱:', error)

    // 降级：返回没有AI增强的菜谱
    return {
      ...selectedRecipe,
      displayName: selectedRecipe.originalName,
      story: selectedRecipe.story || '',
      matchScore: selectedScoredRecipe.score,
      aiEnhanced: false
    }
  }
}

// 生成推荐理由
const generateRecommendationReason = (
  recipe: Recipe,
  score: number,
  useAI: boolean
): string => {
  const reasons: string[] = []

  if (score > 0.8) {
    reasons.push('高度匹配')
  } else if (score > 0.6) {
    reasons.push('符合要求')
  }

  if (recipe.cookingTime && recipe.cookingTime < 20) {
    reasons.push('制作快速')
  }

  if (recipe.difficulty === '简单') {
    reasons.push('操作简单')
  }

  if (useAI) {
    reasons.push('AI智能推荐')
  }

  return reasons.length > 0 ? reasons.join('，') : '为您推荐'
}

// ==================== 新增：高级AI推荐函数 ====================
export const getAIRecipeRecommendation = async (
  userPreferences: UserPreferences,
  selectedIngredients: string[]
): Promise<Recipe | null> => {
  console.log('🤖 使用高级AI推荐模式')
  return await getRecipeRecommendation(userPreferences, selectedIngredients)
}

// ==================== 其他服务函数（完全不变） ====================
export const getRecipeByIdService = async (id: string): Promise<Recipe | null> => {
  const recipe = recipes.find(r => r.id === id)
  return recipe || null
}

export const getRandomRecipe = async (): Promise<Recipe | null> => {
  if (recipes.length === 0) {
    return null
  }

  const randomIndex = Math.floor(Math.random() * recipes.length)
  const recipe = recipes[randomIndex]

  if (!recipe) {
    return null
  }

  try {
    const aiResponse = await enhanceRecipeWithAI(recipe, [])
    return {
      ...recipe,
      displayName: aiResponse.displayName || recipe.originalName,
      story: aiResponse.story,
      aiEnhanced: true
    }
  } catch (error) {
    return {
      ...recipe,
      aiEnhanced: false
    }
  }
}

export const getRecipesByCategory = async (category: string): Promise<Recipe[]> => {
  const filtered = recipes.filter(recipe => recipe.category?.includes(category))

  const enhancedRecipes = await Promise.all(
    filtered.map(async recipe => {
      try {
        const aiResponse = await enhanceRecipeWithAI(recipe, [])
        return {
          ...recipe,
          displayName: aiResponse.displayName || recipe.originalName,
          story: aiResponse.story,
          aiEnhanced: true
        }
      } catch (error) {
        return {
          ...recipe,
          aiEnhanced: false
        }
      }
    })
  )

  return enhancedRecipes
}

// src/services/recipeService.ts - 优化版本
export const getAllIngredients = async (): Promise<string[]> => {
  const allIngredients = new Set<string>()

  recipes.forEach(recipe => {
    recipe.ingredients?.forEach((ingredient: string) => {
      if (ingredient && ingredient.trim()) {
        allIngredients.add(ingredient.trim())
      }
    })
  })

  return Array.from(allIngredients).sort((a, b) => a.localeCompare(b, 'zh-CN'))
}

// ==================== 新增辅助函数 ====================
export const convertChineseFlavorToEnglish = (
  chineseFlavor: Record<string, number>
): Partial<FlavorProfile> => {
  const mapping: Record<string, keyof FlavorProfile> = {
    '甜': 'sweet',
    '酸': 'sour',
    '咸': 'savory',
    '鲜': 'umami',
    '辣': 'spicy',
    '苦': 'bitter'
  }

  const result: Partial<FlavorProfile> = {}

  Object.entries(chineseFlavor).forEach(([key, value]) => {
    const englishKey = mapping[key]
    if (englishKey) {
      result[englishKey] = value
    }
  })

  return result
}