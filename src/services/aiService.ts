// src/services/aiService.ts - 智谱AI完整版
import type { Recipe, FlavorProfile } from '@/types/recipe'

// ==================== 配置 ====================
const ZHIPU_CONFIG = {
  apiKey: import.meta.env.VITE_ZHIPU_API_KEY,
  baseURL: 'https://open.bigmodel.cn/api/paas/v4',
  model: 'glm-4-flash', // 快速模型，适合创意生成
  timeout: 15000 // 15秒超时
}

// ==================== 模拟数据（降级用） ====================
const generateMockCreativeName = (recipe: Recipe): string => {
  const prefixes = ['星辰', '月光', '秘境', '幻彩', '翡翠', '琥珀']
  const suffixes = ['之恋', '协奏曲', '幻想曲', '物语', '奇缘']
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)]
  return `${prefix}${recipe.originalName}${suffix}`
}

const generateMockFlavorStory = (recipe: Recipe): string => {
  // 安全获取食材
  const ingredients = recipe.ingredients || []
  const ing1 = ingredients[0] || '食材'
  const ing2 = ingredients[1] || '美味'

  // 创建字符串数组
  const stories: string[] = [
    `当${ing1}与${ing2}相遇，一场味觉的魔法就此展开。每一口都是对食材的敬意，简单中见真章。`,
    `这道菜凝聚了厨房的小确幸。火候恰到好处，调味精准和谐，让人在忙碌生活中也能品尝到治愈的滋味。`,
    `传统与创新的完美结合。既有记忆中的家常味道，又有意想不到的小惊喜，适合与重要的人分享。`,
    `香气从厨房飘出，预示着美味的诞生。酸甜咸辣巧妙平衡，是一道能唤起美好回忆的菜肴。`
  ]

  // 安全访问
  const randomIndex = Math.floor(Math.random() * stories.length)
  const story = stories[randomIndex]

  // 双重保险
  return story || '这是一道用心制作的美味佳肴，充满温暖与满足。'
}

// ==================== 降级函数 ====================
const createAIFallbackRecipe = (ingredients: string[]): Recipe => {
  const timestamp = Date.now()
  const mainIngredient = ingredients[0] || '创意'
  const secondIngredient = ingredients[1] || '美食'

  return {
    id: `ai-fallback-${timestamp}`,
    originalName: `${mainIngredient}${secondIngredient}创意搭配`,
    displayName: `✨ ${mainIngredient}与${secondIngredient}的魔法组合`,
    description: `基于您选择的食材 ${ingredients.join('、')} 精心设计的创意搭配`,
    ingredients: ingredients,
    steps: [
      '将所选食材洗净切好备用',
      '根据个人喜好选择烹饪方式（炒、煮、蒸等）',
      '尝试不同的调味组合，找到最适合的口味',
      '发挥创意，调整火候和时间'
    ],
    flavorProfile: {
      savory: 3,
      sweet: 2,
      sour: 2,
      spicy: 2,
      umami: 3,
      bitter: 1
    },
    cookingTime: 25,
    difficulty: '简单',
    category: ['创意菜', '自定义'],
    story: '这是一道由AI美食炼金术师为您特别创意的菜谱。虽然没有完全匹配的传统做法，但您选择的食材组合本身就充满了无限可能！',
    aiEnhanced: true,
    matchScore: 0.6,
    recommendationReason: '根据您的食材创意推荐'
  }
}

// ==================== 核心AI调用函数 ====================
const callZhipuAI = async (prompt: string): Promise<string> => {
  // 安全检查：API Key是否存在
  if (!ZHIPU_CONFIG.apiKey || ZHIPU_CONFIG.apiKey === '你的智谱API_Key_在这里') {
    console.warn('⚠️ 智谱API Key未配置，将使用模拟数据')
    throw new Error('AI_API_KEY_NOT_SET')
  }

  try {
    console.log('🧠 正在调用智谱AI...')

    const response = await fetch(`${ZHIPU_CONFIG.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ZHIPU_CONFIG.apiKey}`
      },
      body: JSON.stringify({
        model: ZHIPU_CONFIG.model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8, // 创意度
        max_tokens: 500,  // 最大长度
        stream: false     // 非流式响应
      })
    })

    // 检查HTTP状态
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ AI API响应错误:', response.status, errorText)
      throw new Error(`API_${response.status}`)
    }

    const data = await response.json()

    // 提取AI生成的内容
    const content = data.choices?.[0]?.message?.content?.trim()

    if (!content) {
      console.warn('⚠️ AI返回内容为空')
      throw new Error('AI_EMPTY_RESPONSE')
    }

    console.log('✅ 智谱AI调用成功，生成内容长度:', content.length)
    return content

  } catch (error: any) {
    console.error('❌ 智谱AI调用失败:', error.message)
    throw error // 向上抛出，让上层处理降级
  }
}

// ==================== 创意菜名生成 ====================
export const generateCreativeName = async (
  recipe: Recipe,
  selectedIngredients: string[]
): Promise<string> => {
  try {
    const prompt = `你是一个创意美食命名师，请为这道菜起一个吸引人的名字：

【菜品信息】
原菜名：${recipe.originalName}
主要食材：${selectedIngredients.join('、')}
菜品描述：${recipe.description}
烹饪时间：${recipe.cookingTime}分钟
难度：${recipe.difficulty}

【要求】
1. 名字要独特、有趣、有诗意
2. 长度：3-8个汉字
3. 可以结合食材特点或烹饪方式
4. 适合在美食推荐APP上显示
5. 只返回菜名，不要任何解释
6. 避免使用"秘制""招牌"等俗套词汇

创意菜名：`

    const aiName = await callZhipuAI(prompt)
    return aiName || recipe.originalName

  } catch (error) {
    console.warn('AI命名失败，使用模拟数据')
    return generateMockCreativeName(recipe)
  }
}

// ==================== 风味故事生成 ====================
export const generateFlavorStory = async (
  recipe: Recipe,
  selectedIngredients: string[]
): Promise<string> => {
  try {
    const prompt = `你是一个美食作家，请为这道菜写一段风味故事：

【菜品信息】
菜名：${recipe.originalName}
食材：${selectedIngredients.join('、')}
做法简述：${recipe.description}
口味特点：${Object.entries(recipe.flavorProfile || {})
  .map(([k, v]) => `${k}:${v}/5`)
  .join('，')}

【要求】
1. 写一段20-30字的美食故事
2. 描述菜品的风味、口感、香气
3. 可以有点诗意、幽默或哲学意味
4. 让读者感受到这道菜的独特魅力
5. 用中文，口语化，有温度
6. 只返回故事内容，不要标题

风味故事：`

    const story = await callZhipuAI(prompt)
    return story || ''

  } catch (error) {
    console.warn('AI故事生成失败，使用模拟数据')
    return generateMockFlavorStory(recipe)
  }
}

// ==================== AI菜谱生成主函数 ====================
export const generateAIRecipeFromIngredients = async (
  ingredients: string[]
): Promise<Recipe | null> => {
  try {
    // 构建AI生成菜谱的Prompt
const prompt = `你是一个专业的中华料理厨师，请根据以下食材生成一道完整的菜谱：

【可用食材】
${ingredients.join('、')}

【菜品命名要求】
1. 原菜名必须使用传统中式菜名格式：
   - 格式1：主料+做法，如：青椒炒鸡蛋、土豆炖牛肉
   - 格式2：做法+主料，如：清炒西兰花、红烧肉
   - 格式3：口感+主料，如：酸辣土豆丝、香辣鸡丁

2. 禁止使用以下词汇：
   - "创意搭配"、"魔法组合"、"特色"
   - "秘制"、"招牌"、"私房"（除非必要）
   - 任何带✨、🌟等符号

3. 菜名长度：3-6个汉字
   ✅ 正确：青椒炒蛋、西红柿鸡蛋汤、麻婆豆腐
   ❌ 错误：青椒鸡蛋创意料理、魔法炒蛋

【菜品要求】
1. 描述：20-30字，介绍菜品特点和口感
2. 步骤：3-5个详细步骤，每步清晰可操作
3. 风味：六维度评分（咸甜酸辣鲜苦），每个1-5分
4. 时间：合理烹饪时间（分钟）
5. 难度：简单/中等/困难
6. 分类：如家常菜、快手菜、川菜等

【返回格式】
{
  "originalName": "青椒炒鸡蛋",  // 必须是传统菜名
  "description": "青椒与鸡蛋的经典搭配，色彩鲜艳，营养均衡...",
  "steps": ["青椒切丝", "鸡蛋打散", "热锅炒制", "调味出锅"],
  "flavorProfile": {"savory":4, "sweet":2, "sour":1, "spicy":3, "umami":4, "bitter":1},
  "cookingTime": 15,
  "difficulty": "简单",
  "category": ["家常菜", "快手菜", "素菜"]
}

请直接返回JSON，不要有其他内容：`

    const aiResponse = await callZhipuAI(prompt)

    // 解析AI返回的JSON
    try {
      const aiRecipeData = JSON.parse(aiResponse)

      // 生成唯一的ID
      const recipeId = `ai-generated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // 构建临时Recipe对象用于生成故事
      const tempRecipe: Recipe = {
        id: recipeId,
        originalName: aiRecipeData.originalName,
        displayName: aiRecipeData.originalName,
        description: aiRecipeData.description,
        ingredients: ingredients,
        steps: aiRecipeData.steps,
        flavorProfile: aiRecipeData.flavorProfile,
        cookingTime: aiRecipeData.cookingTime,
        difficulty: aiRecipeData.difficulty as '简单' | '中等' | '困难',
        category: aiRecipeData.category,
        aiEnhanced: true
      }

      // 生成风味故事
      let story = ''
      try {
        story = await generateFlavorStory(tempRecipe, ingredients)
      } catch (storyError) {
        console.warn('生成风味故事失败:', storyError)
        story = `当${ingredients.slice(0, 2).join('与')}相遇，一场美味的邂逅就此展开。`
      }

      // 构建完整的Recipe对象
      const aiGeneratedRecipe: Recipe = {
        ...tempRecipe,
        story: story,
        matchScore: 0.7, // AI生成菜谱给予中等匹配度
        recommendationReason: 'AI根据您的食材创意生成'
      }

      console.log('🎨 AI创意菜谱生成成功:', aiGeneratedRecipe.originalName)
      return aiGeneratedRecipe

    } catch (parseError) {
      console.error('解析AI返回的JSON失败:', parseError)
      // 降级方案：使用模拟数据
      return createAIFallbackRecipe(ingredients)
    }

  } catch (error) {
    console.error('AI菜谱生成失败:', error)
    // 降级方案
    return createAIFallbackRecipe(ingredients)
  }
}

// ==================== 测试函数 ====================
export const testAIConnection = async (): Promise<boolean> => {
  console.log('🧪 开始测试AI连接...')

  try {
    const testPrompt = '请回复"AI连接测试成功"。不要多说其他话。'
    const response = await callZhipuAI(testPrompt)

    if (response.includes('成功')) {
      console.log('🎉 AI连接测试成功！')
      return true
    } else {
      console.warn('⚠️ AI响应异常:', response)
      return false
    }
  } catch (error) {
    console.error('❌ AI连接测试失败')
    return false
  }
}