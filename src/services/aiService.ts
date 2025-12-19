// src/services/aiService.ts - 智谱AI完整版
import type { Recipe } from '@/types/recipe'

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