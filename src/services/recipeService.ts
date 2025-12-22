import { recipes } from '@/data/recipes'
import type { Recipe, UserPreferences, FlavorProfile } from '@/types/recipe'
import { generateCreativeName, generateFlavorStory,generateAIRecipeFromIngredients } from '@/services/aiService'

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
  arg1: string[] | UserPreferences,
  arg2?: string[]
): Promise<Recipe | null> => {

  // 1. 智能解析参数
  let selectedIngredients: string[]
  let userPreferences: UserPreferences

  if (Array.isArray(arg1)) {
    selectedIngredients = arg1
    userPreferences = getDefaultPreferences()
  } else {
    userPreferences = arg1
    selectedIngredients = arg2 || []
  }

  if (!selectedIngredients || selectedIngredients.length === 0) {
    console.warn('⚠️ 没有提供食材，无法推荐')
    return null
  }

  console.log(`🍳 用户选择的食材: ${selectedIngredients.join('、')}`)

  // 2. 智能匹配算法：计算食材匹配度
  const MIN_MATCH_THRESHOLD = 0.7 // 70%匹配度阈值

  const calculateIngredientMatch = (recipe: Recipe, selectedIngredients: string[]): number => {
    if (!recipe.ingredients || recipe.ingredients.length === 0) return 0

    const recipeIngredients = recipe.ingredients.map(ing => ing.toLowerCase())
    const selected = selectedIngredients.map(i => i.toLowerCase())

    // 计算匹配的食材数量
    let matchedCount = 0
    selected.forEach(selectedIngredient => {
      // 检查这个食材是否在菜谱中
      const isMatched = recipeIngredients.some(recipeIngredient => {
        // 更宽松但合理的匹配
        return recipeIngredient.includes(selectedIngredient) ||
               selectedIngredient.includes(recipeIngredient) ||
               // 处理常见别名或相关食材
               (selectedIngredient === '青椒' && (recipeIngredient.includes('椒') || recipeIngredient.includes('辣椒'))) ||
               (selectedIngredient === '鸡蛋' && (recipeIngredient.includes('蛋') || recipeIngredient === '鸡蛋')) ||
               (selectedIngredient === '西红柿' && (recipeIngredient.includes('番茄') || recipeIngredient.includes('西红柿'))) ||
               (selectedIngredient === '土豆' && (recipeIngredient.includes('马铃薯') || recipeIngredient.includes('土豆')))
      })
      if (isMatched) matchedCount++
    })

    // 返回匹配比例：用户选择的食材有多少被菜谱包含
    return selected.length > 0 ? matchedCount / selected.length : 0
  }

  // 3. 应用匹配度阈值
  const potentialRecipes = recipes.map(recipe => {
    const ingredientMatchScore = calculateIngredientMatch(recipe, selectedIngredients)
    return { recipe, ingredientMatchScore }
  })

  console.log('📊 食材匹配度分析:')
  potentialRecipes.forEach(({ recipe, ingredientMatchScore }) => {
    if (ingredientMatchScore > 0) {
      console.log(`  ${recipe.originalName}: ${(ingredientMatchScore * 100).toFixed(1)}%`)
    }
  })

  // 只保留高匹配度菜谱
  const highMatchRecipes = potentialRecipes
    .filter(({ ingredientMatchScore }) => ingredientMatchScore >= MIN_MATCH_THRESHOLD)
    .map(({ recipe, ingredientMatchScore }) => {
      // 为高匹配度菜谱计算最终得分
      const useDetailedPreferences = !Array.isArray(arg1)
      const finalScore = useDetailedPreferences
        ? calculateAIMatchScore(recipe, userPreferences)
        : calculateBasicMatchScore(recipe, selectedIngredients)

      // 将匹配度作为权重（匹配度越高，权重越高）
      const weightedScore = finalScore * ingredientMatchScore

      return { recipe, score: weightedScore, matchScore: ingredientMatchScore }
    })

  console.log(`🔍 找到 ${highMatchRecipes.length} 个高匹配度菜谱（匹配度≥${MIN_MATCH_THRESHOLD * 100}%）`)

  // 4. 如果没有高匹配度菜谱，直接调用AI生成
  if (highMatchRecipes.length === 0) {
    console.log(`🤖 没有找到匹配度≥${MIN_MATCH_THRESHOLD * 100}%的菜谱，调用AI生成创意菜谱...`)
    try {
      const aiRecipe = await generateAIRecipeFromIngredients(selectedIngredients)
      if (aiRecipe) {
        // 对AI生成的菜谱进行创意命名增强
        const aiResponse = await enhanceRecipeWithAI(aiRecipe, selectedIngredients)
        return {
          ...aiRecipe,
          displayName: aiResponse.displayName || aiRecipe.originalName,
          story: aiResponse.story || aiRecipe.story,
          aiEnhanced: true,
          recommendationReason: 'AI根据您的食材创新生成（无高匹配传统菜谱）'
        }
      }
    } catch (error) {
      console.error('AI生成菜谱失败:', error)
      return createAIFallbackRecipe(selectedIngredients)
    }
  }

  // 5. 如果有高匹配度菜谱，按分数排序
  highMatchRecipes.sort((a, b) => b.score - a.score)

  // 6. 选择最佳匹配
  const bestMatch = highMatchRecipes[0]

  if (!bestMatch) {
    console.log('⚠️ 最佳匹配为空，使用AI生成')
    try {
      const aiRecipe = await generateAIRecipeFromIngredients(selectedIngredients)
      return aiRecipe || createAIFallbackRecipe(selectedIngredients)
    } catch (error) {
      return createAIFallbackRecipe(selectedIngredients)
    }
  }

  console.log(`🎯 最佳匹配: ${bestMatch.recipe.originalName} (食材匹配度: ${(bestMatch.matchScore * 100).toFixed(1)}%，综合评分: ${(bestMatch.score * 100).toFixed(1)}%)`)

  // 7. 对最佳匹配进行AI增强
  try {
    const aiResponse = await enhanceRecipeWithAI(bestMatch.recipe, selectedIngredients)
    const useDetailedPreferences = !Array.isArray(arg1)

    return {
      ...bestMatch.recipe,
      displayName: aiResponse.displayName || bestMatch.recipe.originalName,
      story: aiResponse.story,
      matchScore: bestMatch.score,
      aiEnhanced: true,
      recommendationReason: generateRecommendationReason(bestMatch.recipe, bestMatch.score, useDetailedPreferences)
    }
  } catch (error) {
    return {
      ...bestMatch.recipe,
      matchScore: bestMatch.score,
      aiEnhanced: false
    }
  }
}

// 降级函数（简化版，主要函数在aiService.ts中）
const createAIFallbackRecipe = (ingredients: string[]): Recipe => {
  const timestamp = Date.now()

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
    flavorProfile: {
      savory: 3,
      sweet: 3,
      sour: 3,
      spicy: 3,
      umami: 3,
      bitter: 3
    },
    story: '这是一道由AI美食炼金术师为您特别创意的菜谱。虽然没有找到完全匹配的传统菜谱，但您选择的食材组合本身就充满了可能性！',
    cookingTime: 20,
    difficulty: '简单' as const,
    category: ['创意菜', '自定义'],
    matchScore: 0.5,
    aiEnhanced: false,
    recommendationReason: '基础推荐'
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