// src/services/recipeService.ts
import { recipes } from '@/data/recipes'
import type { Recipe } from '@/types/recipe'
import { generateCreativeName, generateFlavorStory } from '@/services/aiService'

export type GetAllIngredientsResponse = string[]

// ==================== 类型定义 ====================
interface AIEnhancementResult {
  displayName: string
  story: string
  flavorProfile?: any
}

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

// ==================== 计算匹配分数 ====================
const calculateMatchScore = (recipe: Recipe, selectedIngredients: string[]): number => {
  // 简化实现，先保证编译
  let score = 0

  // 基础匹配分数
  score += 0.5

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

// ==================== 智能推荐函数 ====================
export const getRecipeRecommendation = async (
  selectedIngredients: string[]
): Promise<Recipe | null> => {
  if (!selectedIngredients || selectedIngredients.length === 0) {
    return null
  }

  // 1. 过滤匹配的菜谱
  const matchingRecipes = recipes.filter(recipe => {
    if (!recipe.ingredients) return false

   const recipeIngredients = recipe.ingredients.map(ing => ing.toLowerCase())
    const selected = selectedIngredients.map(i => i.toLowerCase())

    return selected.some(ingredient =>
      recipeIngredients.some(ri => ri.includes(ingredient) || ingredient.includes(ri))
    )
  })

  if (matchingRecipes.length === 0) {
    return null
  }

  // 2. 计算匹配分数
  const scoredRecipes = matchingRecipes.map(recipe => ({
    recipe,
    score: calculateMatchScore(recipe, selectedIngredients)
  }))

  // 3. 按分数排序
  scoredRecipes.sort((a, b) => b.score - a.score)

  // 4. 选择分数最高的菜谱（或随机选择前3名中的1个）
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

  // 5. 调用AI生成创意名称和故事
  try {
    const aiResponse = await enhanceRecipeWithAI(selectedRecipe, selectedIngredients)

    const enhancedRecipe: Recipe = {
      ...selectedRecipe,
      displayName: aiResponse.displayName || selectedRecipe.originalName,
      story: aiResponse.story,
      flavorProfile: aiResponse.flavorProfile || selectedRecipe.flavorProfile
    }

    return enhancedRecipe
  } catch (error) {
    console.warn('AI增强失败，使用原始菜谱:', error)
    return selectedRecipe
  }
}

// ==================== 其他服务函数 ====================
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
      story: aiResponse.story
    }
  } catch (error) {
    return recipe
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
          story: aiResponse.story
        }
      } catch (error) {
        return recipe
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