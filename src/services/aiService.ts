// src/services/aiService.ts
import type { Recipe, FlavorProfile } from '@/types/recipe'

// ==================== 配置 ====================
const ZHIPU_CONFIG = {
  apiKey: import.meta.env.VITE_ZHIPU_API_KEY,
  baseURL: 'https://open.bigmodel.cn/api/paas/v4',
  model: 'glm-4-flash', // 快速模型，适合创意生成
  timeout: 15000 // 15秒超时
}

// ==================== 智能菜品类型分析 ====================
// ==================== 智能菜品类型分析（修复版） ====================
const analyzeDishType = (ingredients: string[]): string => {
  console.log('🧠 开始菜品类型分析，食材:', ingredients.join('、'))

  // 🎯 定义食材分类（更加科学合理）
  const dishCategories: Record<string, string[]> = {
    // 汤品/炖品：需要汤类食材或炖煮类食材
    '汤品/炖品': [
      // 药材类
      '桂皮', '枸杞', '红枣', '当归', '黄芪', '人参', '党参', '莲子', '百合', '薏米', '芡实',
      // 适合炖煮的食材
      '排骨', '筒骨', '骨头', '猪蹄', '牛骨', '乌鸡', '羊肉', '鲫鱼',
      // 特定蔬菜（适合长时间炖煮）
      '冬瓜', '玉米', '萝卜', '莲藕'
    ],

    // 凉拌/沙拉：明确是冷食的食材
    '凉拌/沙拉': [
      '黄瓜', '西红柿', '生菜', '紫甘蓝', '芝麻菜', '苦菊', '海带', '豆皮',
      '沙拉酱', '醋', '橄榄油', '柠檬汁', '凉粉'
    ],

    // 炒菜：最常见的烹饪方式（默认）
    '炒菜': [
      // 蔬菜类
      '青椒', '土豆', '豆角', '洋葱', '茄子', '西兰花', '菜花', '芹菜',
      // 肉类
      '肉丝', '肉片', '肉末', '牛肉', '猪肉', '鸡肉', '腊肉', '腊肠', '火腿',
      // 蛋类
      '鸡蛋', '鸭蛋',
      // 其他
      '豆腐', '豆干', '虾仁', '鱿鱼', '花蛤',
      // 调味品（暗示炒菜）
      '酱油', '蚝油', '豆豉', '大蒜', '生姜'
    ],

    // 蒸菜：适合蒸的食材
    '蒸菜': [
      '鱼', '虾', '蒸肉', '粉蒸肉', '蒸蛋', '南瓜', '丝瓜', '蛤蜊'
    ],

    // 烤/煎：适合烤或煎的食材
    '烤/煎': [
      '牛排', '羊排', '鸡翅', '鸡腿', '烤肉', '烤鱼', '培根', '香肠'
    ]
  }

  // 🎯 智能分析逻辑 - 使用Record确保类型安全
  const scores: Record<string, number> = {
    '汤品/炖品': 0,
    '凉拌/沙拉': 0,
    '炒菜': 0,
    '蒸菜': 0,
    '烤/煎': 0
  }

  // 分析每个食材
  ingredients.forEach(ingredient => {
    let matched = false

    // 检查每个分类
    for (const [category, categoryIngredients] of Object.entries(dishCategories)) {
      if (categoryIngredients.some(catIng =>
        ingredient.includes(catIng) || catIng.includes(ingredient)
      )) {
        // 🎯 类型安全的增加分数
        const currentScore = scores[category] || 0
        scores[category] = currentScore + 1

        // 🎯 特殊规则：某些食材在特定分类中权重更高
        if (category === '炒菜' && ['青椒', '牛肉', '猪肉', '鸡肉', '豆腐'].includes(ingredient)) {
          scores[category] = scores[category] + 0.5 // 额外权重
        }

        // 🎯 特殊规则：药材类食材强烈暗示汤品
        if (category === '汤品/炖品' && ['桂皮', '枸杞', '红枣', '当归', '黄芪'].includes(ingredient)) {
          scores[category] = scores[category] + 2 // 强权重
        }

        matched = true
      }
    }

    // 如果没匹配到任何分类，默认给炒菜
    if (!matched) {
      scores['炒菜'] = (scores['炒菜'] || 0) + 1
    }
  })

  // 🎯 基于食材组合的智能决策
  // 规则1：如果有肉类+蔬菜，优先考虑炒菜而不是汤
  const hasMeat = ingredients.some(ing => ['牛肉', '猪肉', '鸡肉', '羊肉', '肉丝', '肉片', '肉末'].some(meat => ing.includes(meat)))
  const hasVegetable = ingredients.some(ing => ['青椒', '土豆', '豆角', '洋葱', '茄子', '西兰花', '菜花'].some(veg => ing.includes(veg)))

  if (hasMeat && hasVegetable) {
    scores['炒菜'] = (scores['炒菜'] || 0) + 2 // 强权重：肉+菜 = 炒菜
    scores['汤品/炖品'] = (scores['汤品/炖品'] || 0) - 1 // 减少汤的可能性
  }

  // 规则2：如果有明显是汤料的食材（如药材），增加汤的权重
  const hasSoupIngredients = ingredients.some(ing =>
    ['桂皮', '枸杞', '红枣', '当归', '黄芪', '人参', '党参', '排骨', '筒骨'].some(soupIng => ing.includes(soupIng))
  )
  if (hasSoupIngredients) {
    scores['汤品/炖品'] = (scores['汤品/炖品'] || 0) + 3 // 强权重
  }

  // 规则3：如果食材很少（1-2种），倾向于简单做法（凉拌或炒）
  if (ingredients.length <= 2) {
    // 如果是蔬菜，倾向于凉拌
    const allVegetables = ingredients.every(ing =>
      ['青椒', '黄瓜', '西红柿', '生菜', '紫甘蓝', '豆腐'].some(veg => ing.includes(veg))
    )
    if (allVegetables) {
      scores['凉拌/沙拉'] = (scores['凉拌/沙拉'] || 0) + 1
    } else {
      scores['炒菜'] = (scores['炒菜'] || 0) + 1
    }
  }

  // 🎯 找出得分最高的分类
  let bestCategory = '炒菜' // 默认
  let bestScore = -1

  for (const [category, score] of Object.entries(scores)) {
    console.log(`  ${category}: ${score}分`)
    if (score > bestScore) {
      bestScore = score
      bestCategory = category
    }
  }

  console.log(`🍲 智能分析结果: ${bestCategory} (总分: ${bestScore})`)
  return bestCategory
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

【特别提醒】
如果用户选择了"青椒"和"牛肉"这类组合，应该生成"青椒炒牛肉"而不是"青椒牛肉汤"。
炒菜是最常见的家常菜做法。

【可用食材】
${ingredients.join('、')}

【菜品要求】
1. 菜名格式：必须是中式炒菜名，如"青椒炒牛肉"、"西红柿炒鸡蛋"、"鱼香茄子"
2. 描述：20-35字，强调炒菜的香、鲜、嫩特点
3. 步骤：必须是炒菜步骤，包含热锅、下油、翻炒、调味
4. 时间：15-25分钟（炒菜时间不宜过长）
5. 难度：简单/中等
6. 风味：根据食材特点合理评分
7. 分类：必须包含"炒菜"分类

【返回JSON格式】
{
  "originalName": "青椒炒${ingredients.find(ing => ['牛肉','猪肉','鸡肉','肉丝'].some(keyword => ing.includes(keyword))) || ingredients[0] || '菜'}",
  "description": "香气四溢的家常炒菜，火候恰到好处，肉质鲜嫩，蔬菜爽脆。",
  "steps": ["将食材洗净切好备用", "热锅凉油，放入葱姜蒜爆香", "先炒肉类至变色", "加入蔬菜快速翻炒", "加入酱油、盐等调味料", "翻炒均匀后出锅装盘"],
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

  return dishTypeTemplates[validDishType]!
}

// ==================== 创意菜名验证函数 ====================
const validateCreativeName = (
  creativeName: string,
  originalName: string,
  selectedIngredients: string[]
): string => {
  if (!creativeName || creativeName.trim().length === 0) {
    return originalName
  }

  const name = creativeName.trim()

  // 1. 必须包含"汤"字（如果是汤品）
  if (originalName.includes('汤') && !name.includes('汤')) {
    console.warn('⚠️ 创意菜名缺少"汤"字，使用原菜名')
    return originalName
  }

  // 2. 不能包含用户未选择的食材
  const invalidIngredients = ['八角', '花椒', '辣椒', '姜片', '葱段', '大蒜']
  if (invalidIngredients.some(ing => name.includes(ing) && !selectedIngredients.includes(ing))) {
    console.warn(`⚠️ 创意菜名包含未选择的食材，使用原菜名`)
    return originalName
  }

  // 3. 菜名长度合理（2-12字）
  if (name.length < 2 || name.length > 12) {
    console.warn('⚠️ 创意菜名长度不合理，使用原菜名')
    return originalName
  }

  // 4. 不能与原菜名完全无关
  const mainIngredients = selectedIngredients.slice(0, 3)
  const hasConnection = mainIngredients.some(ing =>
    originalName.includes(ing) || name.includes(ing)
  )

  if (!hasConnection && name.length < 3) {
    console.warn('⚠️ 创意菜名与原菜名关联度太低，使用原菜名')
    return originalName
  }

  return name
}

// ==================== 模拟数据（降级用） ====================
const generateMockCreativeName = (recipe: Recipe): string => {
  // 根据原菜名生成合理的创意名
  const originalName = recipe.originalName || ''

  if (originalName.includes('汤')) {
    const prefixes = ['暖心', '暖香', '星月', '翡翠', '琥珀', '秘制']
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]

    // 提取原菜名中的主要部分
    const mainPart = originalName.replace('汤', '')
    return `${prefix}${mainPart}汤`
  }

  // 非汤品的默认处理
  const prefixes = ['星辰', '月光', '秘境']
  const suffixes = ['之恋', '协奏曲', '幻想曲']
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
    const dishType = analyzeDishType(selectedIngredients)

    const prompt = `你是一个创意美食命名师，请为这道${dishType}起一个富有诗意且有吸引力的名字：

【菜品信息】
原菜名：${recipe.originalName}
主要食材：${selectedIngredients.join('、')}
菜品类型：${dishType}
菜品描述：${recipe.description}

【命名要求】
1. 名字要基于原菜名进行创意美化，但不能改变菜品的本质
2. 如果原菜名包含主要食材，创意名也应体现这些食材
3. 长度：3-8个汉字
4. ${dishType.includes('汤') ? '必须包含"汤"字' : '不能包含无关的食材名'}
5. 格式参考：
   - 原菜名："八宝桂皮枸杞红枣汤" → 创意名："暖香八宝汤"、"桂杞红枣暖身汤"
   - 原菜名："麻婆豆腐" → 创意名："麻辣豆腐香"、"香辣豆腐煲"
6. 禁止使用与原菜名无关的食材名
7. 只返回创意菜名，不要任何解释

创意菜名：`

    const aiName = await callZhipuAI(prompt)

    // 验证创意菜名的合理性
    const validName = validateCreativeName(aiName, recipe.originalName, selectedIngredients)
    return validName || recipe.originalName

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

      // 🎯 修复：只验证主要食材（非调料）
      const mainIngredients = ingredients.filter(ing =>
        !['油', '盐', '糖', '酱油', '醋', '料酒', '水', '淀粉'].includes(ing)
      )

      const hasAllMainIngredients = mainIngredients.every(ingredient =>
        recipeName.includes(ingredient)
      )

      // 如果没有包含主要食材，修正菜名
      if (!hasAllMainIngredients && mainIngredients.length > 0) {
        // 根据菜品类型生成合适的菜名
        let correctedName = ''

        if (dishType.includes('汤')) {
          // 汤品：主要食材 + 汤
          const mainPart = mainIngredients.slice(0, 3).join('')
          correctedName = mainIngredients.length >= 3
            ? `${mainPart}汤`
            : `${mainIngredients[0]}${mainIngredients[1] || ''}汤`
        } else if (dishType.includes('炒')) {
          // 炒菜：食材1+食材2+炒
          correctedName = mainIngredients.length >= 2
            ? `${mainIngredients[0]}${mainIngredients[1]}炒${mainIngredients[2] || ''}`
            : `${mainIngredients[0]}炒`
        } else {
          correctedName = mainIngredients.slice(0, 3).join('') + '菜'
        }

        if (correctedName && correctedName !== recipeName) {
          console.log(`🔄 修正菜名: "${recipeName}" → "${correctedName}"`)
          aiRecipeData.originalName = correctedName
        }
      }

      // 验证步骤是否包含主要食材
      const stepsText = aiRecipeData.steps?.join(' ') || ''
      const stepsHaveIngredients = mainIngredients.some(ingredient =>
        stepsText.includes(ingredient)
      )

      if (!stepsHaveIngredients && mainIngredients.length > 0) {
        type ValidDishType = '汤品/炖品' | '凉拌/沙拉' | '炒菜' | '蒸菜' | '烤/煎';
        // 修正步骤，确保包含主要食材
        const dishSteps = {
          '汤品/炖品': [
            `准备${ingredients.join('、')}`,
            `将${mainIngredients[0]}和${mainIngredients[1] || '其他食材'}清洗干净`,
            `加入适量清水炖煮`,
            `调味后慢炖至食材软烂`
          ],
          '凉拌/沙拉': [
            `准备${ingredients.join('、')}`,
            `将${mainIngredients[0]}和${mainIngredients[1] || '其他食材'}清洗切配`,
            `调制酱汁拌匀`,
            `装盘即可食用`
          ],
          '炒菜': [
            `准备${ingredients.join('、')}`,
            `将${mainIngredients[0]}和${mainIngredients[1] || '其他食材'}处理干净`,
            `热锅加油，依次加入${mainIngredients.join('、')}`,
            `翻炒均匀，调味后即可出锅`
          ],
          '蒸菜': [
            `准备${ingredients.join('、')}`,
            `将${mainIngredients[0]}和${mainIngredients[1] || '其他食材'}处理腌制`,
            `上锅蒸制`,
            `蒸好后淋汁调味`
          ],
          '烤/煎': [
            `准备${ingredients.join('、')}`,
            `将${mainIngredients[0]}和${mainIngredients[1] || '其他食材'}腌制入味`,
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
        displayName: aiRecipeData.originalName, // 先使用原菜名
        description: aiRecipeData.description,
        ingredients: ingredients,
        steps: aiRecipeData.steps,
        flavorProfile: aiRecipeData.flavorProfile,
        cookingTime: aiRecipeData.cookingTime,
        difficulty: aiRecipeData.difficulty as '简单' | '中等' | '困难',
        category: aiRecipeData.category,
        aiEnhanced: true
      }

      // 🎯 先生成创意菜名，但验证合理性
      let displayName = tempRecipe.originalName
      try {
        const creativeName = await generateCreativeName(tempRecipe, ingredients)
        // 验证创意菜名
        if (creativeName &&
            creativeName !== tempRecipe.originalName &&
            validateCreativeName(creativeName, tempRecipe.originalName, ingredients)) {
          displayName = creativeName
          console.log(`🎨 创意命名成功: "${tempRecipe.originalName}" → "${displayName}"`)
        }
      } catch (nameError) {
        console.warn('创意命名失败，使用原菜名:', nameError)
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
        displayName: displayName, // 使用验证后的创意名或原菜名
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