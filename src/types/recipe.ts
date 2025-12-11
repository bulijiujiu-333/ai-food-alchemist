// src/types/recipe.ts
export interface Recipe {
  id: string
  originalName: string // 原始菜名，如"西红柿炒鸡蛋"
  displayName: string // AI生成的创意菜名，如"魔法红宝石炒蛋"
  description: string // 菜谱描述
  ingredients: string[] // 食材列表
  steps: string[] // 制作步骤
  flavorProfile: FlavorProfile // 风味评分
  story?: string // AI生成的风味故事（可选）
  tips?: string // 小贴士（可选）
  cookingTime?: number // 烹饪时间（分钟）
  difficulty?: '简单' | '中等' | '困难' // 难度
  category?: string[] // 分类标签
}

export interface FlavorProfile {
  savory: number // 咸 (0-5)
  sweet: number // 甜 (0-5)
  sour: number // 酸 (0-5)
  spicy: number // 辣 (0-5)
  umami: number // 鲜 (0-5)
  bitter: number // 苦 (0-5)
}

export interface Ingredient {
  id: string
  name: string
  category: string // 蔬菜、肉类、调料等
  common: boolean // 是否常用食材
}

export interface RecipeRecommendation {
  recipe: Recipe
  matchScore: number // 匹配分数
  missingIngredients: string[] // 缺少的食材
}

export interface AIResponse {
  displayName: string
  story: string
  flavorProfile?: FlavorProfile
}
