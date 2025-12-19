// src/types/recipe.ts

// 菜谱接口
export interface Recipe {
  id: string
  originalName: string        // 原始菜名
  displayName: string        // 显示菜名（AI生成）
  description: string        // 菜谱描述
  ingredients: string[]      // 食材列表
  steps: string[]           // 制作步骤
  flavorProfile: FlavorProfile // 风味评分
  story?: string            // AI生成的故事（可选）
  tips?: string             // 小贴士（可选）
  cookingTime?: number      // 烹饪时间（分钟）
  difficulty?: '简单' | '中等' | '困难'  // 难度级别
  category?: string[]       // 分类标签

  matchScore?: number       // 匹配分数 (0-1)
  aiEnhanced?: boolean      // 是否经过AI增强
  recommendationReason?: string // 推荐理由
}

// 风味评分接口
export interface FlavorProfile {
  savory: number  // 咸 (0-5)
  sweet: number   // 甜 (0-5)
  sour: number    // 酸 (0-5)
  spicy: number   // 辣 (0-5)
  umami: number   // 鲜 (0-5)
  bitter: number  // 苦 (0-5)
}

// 食材接口
export interface Ingredient {
  id: string
  name: string
  category: string  // 蔬菜、肉类、调料等
  common: boolean   // 是否常见
}

// 推荐结果接口
export interface RecipeRecommendation {
  recipe: Recipe
  matchScore: number        // 匹配分数
  missingIngredients: string[]  // 缺少的食材
}

// AI响应接口
export interface AIResponse {
  displayName: string
  story: string
  flavorProfile?: FlavorProfile
}

//用户偏好类型
export interface UserPreferences {
  // 风味偏好（1-5分）- 可选
  flavorPreferences?: Partial<FlavorProfile>

  // 可选的其他偏好
  dietaryRestrictions?: string[]
  preferredCookingTime?: number
  preferredDifficulty?: '简单' | '中等' | '困难'
}