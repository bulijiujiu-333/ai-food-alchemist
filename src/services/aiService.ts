// src/services/aiService.ts - 智谱AI完整版
import type { Recipe, FlavorProfile } from '@/types/recipe'

// ==================== 配置 ====================
const ZHIPU_CONFIG = {
  apiKey: import.meta.env.VITE_ZHIPU_API_KEY,
  baseURL: 'https://open.bigmodel.cn/api/paas/v4',
  model: 'glm-4-flash', // 快速模型，适合创意生成
  timeout: 15000 // 15秒超时
}

// ==================== 智能菜品类型分析 ====================
const analyzeDishType = (ingredients: string[]): string => {
  // 常见汤品/炖品食材
  const soupIngredients = ['桂皮', '枸杞', '红枣', '当归', '黄芪', '人参', '党参',
                          '鸡肉', '鸭肉', '排骨', '筒骨', '鲫鱼', '冬瓜', '玉米',
                          '骨头', '瘦肉', '猪蹄', '乌鸡', '羊肉', '牛肉', '牛骨',
                          '香菇', '木耳', '银耳', '莲子', '百合', '薏米', '芡实']

  // 常见凉拌/沙拉食材
  const saladIngredients = ['黄瓜', '西红柿', '生菜', '紫甘蓝', '芝麻菜', '苦菊',
                           '沙拉酱', '醋', '橄榄油', '柠檬', '洋葱', '胡萝卜',
                           '青椒', '红椒', '黄椒', '香菜', '葱花', '芝麻']

  // 常见炒菜食材
  const stirFryIngredients = ['青椒', '肉丝', '鸡蛋', '土豆', '豆角', '洋葱',
                             '大蒜', '生姜', '酱油', '蚝油', '豆豉', '腊肉',
                             '腊肠', '香肠', '火腿', '虾仁', '鱿鱼', '花蛤']

  // 常见蒸菜食材
  const steamedIngredients = ['鱼', '虾', '蒸肉', '粉蒸肉', '蒸蛋', '南瓜',
                             '排骨', '鸡肉', '豆腐', '茄子', '丝瓜', '蛤蜊']

  // 常见烤/煎食材
  const grillIngredients = ['牛排', '羊排', '鸡翅', '鸡腿', '烤肉', '烤鱼',
                           '香肠', '培根', '土豆', '玉米', '茄子', '蘑菇']

  // 统计食材类型
  let soupCount = 0
  let saladCount = 0
  let stirFryCount = 0
  let steamedCount = 0
  let grillCount = 0

  ingredients.forEach(ingredient => {
    const ingredientLower = ingredient.toLowerCase()

    if (soupIngredients.some(soupIng =>
      ingredient.includes(soupIng) || soupIng.includes(ingredient))) {
      soupCount++
    }
    if (saladIngredients.some(saladIng =>
      ingredient.includes(saladIng) || saladIng.includes(ingredient))) {
      saladCount++
    }
    if (stirFryIngredients.some(stirFryIng =>
      ingredient.includes(stirFryIng) || stirFryIng.includes(ingredient))) {
      stirFryCount++
    }
    if (steamedIngredients.some(steamedIng =>
      ingredient.includes(steamedIng) || steamedIng.includes(ingredient))) {
      steamedCount++
    }
    if (grillIngredients.some(grillIng =>
      ingredient.includes(grillIng) || grillIng.includes(ingredient))) {
      grillCount++
    }

    // 额外判断：包含"汤"、"煲"、"炖"等字样的食材
    if (ingredient.includes('汤') || ingredient.includes('煲') || ingredient.includes('炖')) {
      soupCount += 2 // 给额外权重
    }
  })

  // 判断主要类型
  const typeScores = [
    { type: '汤品/炖品', score: soupCount },
    { type: '凉拌/沙拉', score: saladCount },
    { type: '炒菜', score: stirFryCount },
    { type: '蒸菜', score: steamedCount },
    { type: '烤/煎', score: grillCount }
  ]

  // 按分数排序
  typeScores.sort((a, b) => b.score - a.score)

  // 返回最高分的类型，如果分数为0则默认炒菜
  const topScore = typeScores[0]
  return topScore && topScore.score > 0 ? topScore.type : '炒菜'
}

// ==================== 根据菜品类型构建Prompt ====================
const buildAIPromptByDishType = (ingredients: string[], dishType: string): string => {
  const dishTypeTemplates: Record<string, string> = {
    '汤品/炖品': `你是一个专业的中式汤品厨师，请根据以下食材设计一道汤品或炖菜：

【可用食材】
${ingredients.join('、')}

【菜品要求】
1. 菜名格式：必须是中式汤品或炖菜名，如"桂皮枸杞红枣汤"、"当归黄芪鸡汤"、"土豆炖牛肉"
2. 描述：25-40字，描述汤品的功效、特点和风味
3. 步骤：必须是煲汤/炖煮步骤，包含清洗、处理、炖煮、调味等，要详细具体
4. 时间：合理的煲汤时间（30-120分钟）
5. 难度：简单/中等
6. 风味：根据汤品特点合理评分，汤品一般鲜味(umami)较高
7. 分类：必须包含"汤品"或"炖菜"分类

【返回JSON格式】
{
  "originalName": "桂皮枸杞红枣汤",
  "description": "滋补养生的汤品，桂皮温暖脾胃，枸杞明目，红枣补血，适合秋冬季节食用。",
  "steps": ["将桂皮、枸杞、红枣清洗干净", "将所有食材放入炖锅中", "加入适量清水，大火烧开后转小火慢炖1小时", "根据口味可加入少许冰糖或盐调味", "炖至汤汁浓郁即可享用"],
  "flavorProfile": {"savory":3, "sweet":4, "sour":1, "spicy":1, "umami":5, "bitter":2},
  "cookingTime": 60,
  "difficulty": "简单",
  "category": ["汤品", "养生", "滋补", "甜品"]
}`,

    '凉拌/沙拉': `你是一个专业的凉菜厨师，请根据以下食材设计一道凉拌菜或沙拉：

【可用食材】
${ingredients.join('、')}

【菜品要求】
1. 菜名格式：凉拌菜或沙拉名，如"凉拌黄瓜"、"西红柿鸡蛋沙拉"、"三色蔬菜沙拉"
2. 描述：20-30字，描述菜品的清爽开胃特点
3. 步骤：凉拌步骤，包含清洗、切配、调味、拌匀，要详细具体
4. 时间：制作时间短（5-15分钟）
5. 难度：简单
6. 风味：清新爽口，酸味(sour)一般较高
7. 分类：必须包含"凉菜"或"沙拉"分类

【返回JSON格式】
{
  "originalName": "凉拌${ingredients[0] || '三鲜'}",
  "description": "清爽开胃的凉拌菜，口感脆爽，适合夏季食用，营养健康。",
  "steps": ["将食材清洗干净并切好", "调制酱汁：将醋、酱油、糖、香油按比例混合", "将切好的食材放入大碗中", "淋上调好的酱汁，轻轻拌匀", "装盘后撒上芝麻或香菜点缀"],
  "flavorProfile": {"savory":2, "sweet":3, "sour":4, "spicy":2, "umami":2, "bitter":1},
  "cookingTime": 10,
  "difficulty": "简单",
  "category": ["凉菜", "沙拉", "开胃菜", "快手菜"]
}`,

    '炒菜': `你是一个专业的中式炒菜厨师，请根据以下食材设计一道炒菜：

【可用食材】
${ingredients.join('、')}

【菜品要求】
1. 菜名格式：中式炒菜名，如"青椒炒肉丝"、"西红柿炒鸡蛋"、"鱼香茄子"
2. 描述：20-35字，描述菜品的色香味特点
3. 步骤：炒菜步骤，包含准备、预处理、炒制、调味，要详细具体
4. 时间：15-30分钟
5. 难度：简单/中等
6. 风味：根据食材特点评分
7. 分类：必须包含"炒菜"分类

【返回JSON格式】
{
  "originalName": "${ingredients[0] || '家常'}${ingredients[1] ? '炒' + ingredients[1] : '炒菜'}",
  "description": "色香味俱全的家常炒菜，火候恰到好处，营养均衡，下饭美味。",
  "steps": ["将食材清洗干净并切好备用", "热锅凉油，放入葱姜蒜爆香", "依次加入食材进行翻炒", "加入酱油、盐等调味料调味", "翻炒均匀后即可出锅装盘"],
  "flavorProfile": {"savory":4, "sweet":2, "sour":2, "spicy":3, "umami":4, "bitter":1},
  "cookingTime": 20,
  "difficulty": "简单",
  "category": ["炒菜", "家常菜", "快手菜"]
}`,

    '蒸菜': `你是一个专业的蒸菜厨师，请根据以下食材设计一道蒸菜：

【可用食材】
${ingredients.join('、')}

【菜品要求】
1. 菜名格式：中式蒸菜名，如"清蒸鱼"、"粉蒸肉"、"蒜蓉蒸虾"
2. 描述：20-35字，描述蒸菜的原汁原味特点
3. 步骤：蒸菜步骤，包含准备、腌制、摆盘、蒸制、淋汁，要详细具体
4. 时间：15-40分钟
5. 难度：简单/中等
6. 风味：原汁原味，鲜味(umami)一般较高
7. 分类：必须包含"蒸菜"分类

【返回JSON格式】
{
  "originalName": "清蒸${ingredients.find(ing => ['鱼','虾','肉','鸡'].some(keyword => ing.includes(keyword))) || ingredients[0] || '鱼'}",
  "description": "原汁原味的蒸菜，保留食材本身的鲜美，健康营养，做法简单。",
  "steps": ["将食材处理干净，用料酒、姜片腌制10分钟", "将食材摆放在盘中，放上葱姜", "蒸锅水开后放入食材，大火蒸制", "蒸好后取出，倒掉盘中多余水分", "淋上蒸鱼豉油或特制酱汁，撒上葱花和热油"],
  "flavorProfile": {"savory":3, "sweet":2, "sour":1, "spicy":1, "umami":5, "bitter":1},
  "cookingTime": 25,
  "difficulty": "简单",
  "category": ["蒸菜", "健康", "清淡"]
}`,

    '烤/煎': `你是一个专业的烤肉厨师，请根据以下食材设计一道烤菜或煎菜：

【可用食材】
${ingredients.join('、')}

【菜品要求】
1. 菜名格式：烤菜或煎菜名，如"香煎牛排"、"烤鸡翅"、"煎鱼排"
2. 描述：20-35字，描述菜品的外焦里嫩特点
3. 步骤：烤/煎步骤，包含腌制、预热、烤/煎制、翻面、调味，要详细具体
4. 时间：20-40分钟
5. 难度：中等
6. 风味：香气浓郁，味道丰富
7. 分类：必须包含"烤菜"或"煎菜"分类

【返回JSON格式】
{
  "originalName": "${ingredients.find(ing => ['牛排','鸡翅','鱼排','羊排'].some(keyword => ing.includes(keyword))) ? '香煎' + ingredients.find(ing => ['牛排','鸡翅','鱼排','羊排'].some(keyword => ing.includes(keyword))) : '烤' + ingredients[0] || '烤肉'}",
  "description": "外焦里嫩的烤制美食，香气四溢，口感丰富，适合朋友聚餐。",
  "steps": ["将食材用盐、黑胡椒、香料腌制30分钟", "预热烤箱或平底锅", "将食材放入烤盘或锅中，中火烤/煎制", "适时翻面，确保两面均匀受热", "烤/煎至金黄熟透，撒上调味料即可"],
  "flavorProfile": {"savory":4, "sweet":3, "sour":2, "spicy":3, "umami":4, "bitter":1},
  "cookingTime": 30,
  "difficulty": "中等",
  "category": ["烤菜", "煎菜", "西餐", "聚餐"]
}`
  }

  const validDishType = Object.keys(dishTypeTemplates).includes(dishType)
    ? dishType
    : '炒菜'

  return dishTypeTemplates[validDishType]! || dishTypeTemplates['炒菜']!
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
  const dishType = analyzeDishType(ingredients)
  const mainIngredient = ingredients[0] || '创意'
  const secondIngredient = ingredients[1] || '美食'

  // 根据菜品类型创建不同的降级菜谱
  let originalName = ''
  let steps: string[] = []
  let description = ''
  let cookingTime = 20

  switch(dishType) {
    case '汤品/炖品':
      originalName = `${mainIngredient}${secondIngredient}汤`
      steps = [
        `准备${ingredients.join('、')}`,
        '将食材清洗干净',
        '加入适量清水',
        '大火烧开后转小火慢炖',
        '根据口味调味',
        '炖煮至食材软烂即可'
      ]
      description = `营养丰富的${originalName}，滋补养生`
      cookingTime = 60
      break

    case '凉拌/沙拉':
      originalName = `凉拌${mainIngredient}`
      steps = [
        `准备${ingredients.join('、')}`,
        '将食材清洗切配',
        '调制酱汁',
        '拌匀所有食材',
        '装盘即可食用'
      ]
      description = `清爽开胃的${originalName}`
      cookingTime = 10
      break

    case '蒸菜':
      originalName = `清蒸${mainIngredient}`
      steps = [
        `准备${ingredients.join('、')}`,
        '食材处理干净',
        '腌制调味',
        '上锅蒸制',
        '蒸好后淋上热油或酱汁'
      ]
      description = `原汁原味的${originalName}`
      cookingTime = 25
      break

    case '烤/煎':
      originalName = `香煎${mainIngredient}`
      steps = [
        `准备${ingredients.join('、')}`,
        '食材腌制入味',
        '预热平底锅或烤箱',
        '烤/煎至两面金黄',
        '出锅装盘'
      ]
      description = `外焦里嫩的${originalName}`
      cookingTime = 30
      break

    default: // 炒菜
      originalName = `${mainIngredient}${secondIngredient ? '炒' + secondIngredient : '炒'}`
      steps = [
        `准备${ingredients.join('、')}`,
        '热锅加油',
        '依次加入食材翻炒',
        '调味翻炒均匀',
        '出锅装盘'
      ]
      description = `美味的${originalName}`
      cookingTime = 20
  }

  return {
    id: `ai-fallback-${timestamp}`,
    originalName: originalName,
    displayName: `✨ ${originalName}`,
    description: description,
    ingredients: ingredients,
    steps: steps,
    flavorProfile: {
      savory: 3,
      sweet: 3,
      sour: 2,
      spicy: 2,
      umami: 4,
      bitter: 1
    },
    cookingTime: cookingTime,
    difficulty: '简单' as const,
    category: [
      dishType.split('/')[0] || '家常菜', // 兜底默认值
      '创意菜',
      '自定义'
    ],
    story: `这是一道根据${ingredients.join('、')}特别设计的${dishType}。`,
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
    // 1. 智能分析菜品类型
    const dishType = analyzeDishType(ingredients)
    console.log(`🍲 智能分析菜品类型: ${dishType} (基于食材: ${ingredients.join('、')})`)

    // 2. 根据菜品类型构建不同的Prompt
    const prompt = buildAIPromptByDishType(ingredients, dishType)

    const aiResponse = await callZhipuAI(prompt)
    console.log('🔍 AI原始响应:', aiResponse)

    // 解析AI返回的JSON
    try {
      const aiRecipeData = JSON.parse(aiResponse)

      // 验证菜名是否包含主要食材
      const recipeName = aiRecipeData.originalName || ''
      const hasAllIngredients = ingredients.every(ingredient =>
        recipeName.includes(ingredient) || ingredient.includes('油') || ingredient.includes('盐') || ingredient.includes('糖')
      )

      // 如果没有包含主要食材，修正菜名
      if (!hasAllIngredients && ingredients.length > 0) {
        const mainIngredients = ingredients.filter(ing =>
          !['油', '盐', '糖', '酱油', '醋', '料酒'].includes(ing)
        )
        if (mainIngredients.length >= 2) {
          const dishSuffix = dishType === '汤品/炖品' ? '汤' :
                            dishType === '凉拌/沙拉' ? '沙拉' :
                            dishType === '蒸菜' ? '蒸' : '炒'
          aiRecipeData.originalName = `${mainIngredients[0]}${mainIngredients[1]}${dishSuffix}${mainIngredients.length > 2 ? mainIngredients[2] : ''}`
        }
      }

      // 验证步骤是否包含主要食材
      const stepsText = aiRecipeData.steps?.join(' ') || ''
      const stepsHaveIngredients = ingredients.some(ingredient =>
        stepsText.includes(ingredient) && !['油', '盐', '糖'].includes(ingredient)
      )

      if (!stepsHaveIngredients) {
        type ValidDishType = '汤品/炖品' | '凉拌/沙拉' | '炒菜' | '蒸菜' | '烤/煎';
        // 修正步骤，确保包含主要食材
        const dishSteps = {
          '汤品/炖品': [
            `准备${ingredients.join('、')}`,
            `将${ingredients[0]}和${ingredients[1] || '其他食材'}清洗干净`,
            `加入适量清水炖煮`,
            `调味后慢炖至食材软烂`
          ],
          '凉拌/沙拉': [
            `准备${ingredients.join('、')}`,
            `将${ingredients[0]}和${ingredients[1] || '其他食材'}清洗切配`,
            `调制酱汁拌匀`,
            `装盘即可食用`
          ],
          '炒菜': [
            `准备${ingredients.join('、')}`,
            `将${ingredients[0]}和${ingredients[1] || '其他食材'}处理干净`,
            `热锅加油，依次加入${ingredients.filter(ing => !['油', '盐', '糖'].includes(ing)).join('、')}`,
            `翻炒均匀，调味后即可出锅`
          ],
          '蒸菜': [
            `准备${ingredients.join('、')}`,
            `将${ingredients[0]}和${ingredients[1] || '其他食材'}处理腌制`,
            `上锅蒸制`,
            `蒸好后淋汁调味`
          ],
          '烤/煎': [
            `准备${ingredients.join('、')}`,
            `将${ingredients[0]}和${ingredients[1] || '其他食材'}腌制入味`,
            `预热后烤/煎制`,
            `烤/煎至金黄熟透`
          ]
        }
        aiRecipeData.steps = (Object.keys(dishSteps).includes(dishType)
        ? dishSteps[dishType as ValidDishType]
        : dishSteps['炒菜']) || dishSteps['炒菜'];
      }

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
        story = `这道${dishType.split('/')[0]}融合了${ingredients.slice(0, 3).join('、')}的独特风味，是一次创新的美食尝试。`
      }

      // 构建完整的Recipe对象
      const aiGeneratedRecipe: Recipe = {
        ...tempRecipe,
        story: story,
        matchScore: 0.7,
        recommendationReason: `AI根据您的食材智能推荐${dishType}`
      }

      console.log('🎨 AI创意菜谱生成成功:', {
        菜品类型: dishType,
        原菜名: aiGeneratedRecipe.originalName,
        显示菜名: aiGeneratedRecipe.displayName,
        食材: aiGeneratedRecipe.ingredients,
        步骤数: aiGeneratedRecipe.steps?.length
      })
      return aiGeneratedRecipe

    } catch (parseError) {
      console.error('解析AI返回的JSON失败:', parseError, '原始响应:', aiResponse)
      // 降级方案
      return createAIFallbackRecipe(ingredients)
    }

  } catch (error) {
    console.error('AI菜谱生成失败:', error)
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