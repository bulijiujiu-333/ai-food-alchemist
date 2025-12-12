// src/data/recipes.ts
import { Recipe } from '@/types/recipe'

// 菜谱数据库
export const recipes: Recipe[] = [
  {
    id: 'recipe-001',
    originalName: '西红柿炒鸡蛋',
    displayName: '西红柿炒鸡蛋',
    description: '经典家常菜，营养丰富，简单易做',
    ingredients: ['鸡蛋', '西红柿', '盐', '糖', '油', '葱'],
    steps: [
      '西红柿洗净切块，鸡蛋打散加少许盐',
      '热锅冷油，倒入蛋液炒至凝固后盛出',
      '锅中再加少许油，放入西红柿翻炒出汁',
      '加入炒好的鸡蛋，加盐和糖调味',
      '翻炒均匀后撒上葱花即可出锅'
    ],
    flavorProfile: {
      savory: 4,
      sweet: 3,
      sour: 3,
      spicy: 1,
      umami: 4,
      bitter: 1
    },
    cookingTime: 15,
    difficulty: '简单',
    category: ['家常菜', '快手菜', '素菜']
  },
  {
    id: 'recipe-002',
    originalName: '土豆炖牛肉',
    displayName: '土豆炖牛肉',
    description: '营养丰富的经典炖菜',
    ingredients: ['牛肉', '土豆', '胡萝卜', '洋葱', '姜', '蒜', '八角', '酱油', '料酒', '盐', '糖'],
    steps: [
      '牛肉切块焯水去血沫',
      '土豆、胡萝卜切滚刀块，洋葱切块',
      '热锅冷油，爆香姜蒜和八角',
      '加入牛肉翻炒至变色',
      '加入料酒、酱油、糖调味',
      '加入足够的水，大火烧开后转小火炖1小时',
      '加入土豆、胡萝卜、洋葱继续炖20分钟',
      '最后加盐调味，大火收汁'
    ],
    flavorProfile: {
      savory: 5,
      sweet: 3,
      sour: 1,
      spicy: 2,
      umami: 5,
      bitter: 1
    },
    cookingTime: 90,
    difficulty: '中等',
    category: ['炖菜', '肉类', '营养餐']
  },
  {
    id: 'recipe-003',
    originalName: '麻婆豆腐',
    displayName: '麻婆豆腐',
    description: '麻辣鲜香的四川名菜',
    ingredients: ['豆腐', '猪肉末', '豆瓣酱', '花椒', '辣椒面', '葱', '姜', '蒜', '酱油', '淀粉', '盐'],
    steps: [
      '豆腐切块，放入盐水中焯水后捞出',
      '热锅冷油，爆香葱姜蒜末',
      '加入猪肉末炒至变色',
      '加入豆瓣酱和辣椒面炒出红油',
      '加入适量水，放入豆腐块',
      '小火炖煮5分钟让豆腐入味',
      '加入酱油调味，水淀粉勾芡',
      '撒上花椒面和葱花即可'
    ],
    flavorProfile: {
      savory: 5,
      sweet: 1,
      sour: 1,
      spicy: 5,
      umami: 4,
      bitter: 2
    },
    cookingTime: 25,
    difficulty: '中等',
    category: ['川菜', '辣味', '豆制品']
  },
  {
    id: 'recipe-004',
    originalName: '青椒肉丝',
    displayName: '青椒肉丝',
    description: '快手小炒，色香味俱全',
    ingredients: ['猪肉', '青椒', '姜', '蒜', '酱油', '料酒', '淀粉', '盐', '糖', '油'],
    steps: [
      '猪肉切丝，用料酒、酱油、淀粉腌制10分钟',
      '青椒切丝，姜蒜切末',
      '热锅冷油，快速滑炒肉丝至变色后盛出',
      '锅中留底油，爆香姜蒜末',
      '加入青椒丝翻炒至断生',
      '加入炒好的肉丝，加盐、糖调味',
      '快速翻炒均匀即可出锅'
    ],
    flavorProfile: {
      savory: 4,
      sweet: 2,
      sour: 1,
      spicy: 3,
      umami: 4,
      bitter: 2
    },
    cookingTime: 20,
    difficulty: '简单',
    category: ['小炒', '家常菜', '快手菜']
  },
  {
    id: 'recipe-005',
    originalName: '宫保鸡丁',
    displayName: '宫保鸡丁',
    description: '经典川菜，酸甜微辣',
    ingredients: ['鸡胸肉', '花生米', '干辣椒', '花椒', '葱', '姜', '蒜', '酱油', '醋', '糖', '料酒', '淀粉', '盐'],
    steps: [
      '鸡胸肉切丁，用料酒、淀粉、盐腌制15分钟',
      '调制宫保汁：酱油、醋、糖、淀粉、水混合均匀',
      '热锅冷油，将鸡丁滑炒至变色后盛出',
      '锅中留底油，爆香干辣椒、花椒、葱姜蒜',
      '加入炒好的鸡丁和花生米',
      '倒入宫保汁，快速翻炒均匀',
      '汁液浓稠后即可出锅'
    ],
    flavorProfile: {
      savory: 4,
      sweet: 4,
      sour: 3,
      spicy: 4,
      umami: 4,
      bitter: 1
    },
    cookingTime: 25,
    difficulty: '中等',
    category: ['川菜', '经典', '鸡肉']
  },
  {
    id: 'recipe-006',
    originalName: '鱼香茄子',
    displayName: '鱼香茄子',
    description: '鱼香味浓，下饭神器',
    ingredients: ['茄子', '猪肉末', '豆瓣酱', '葱', '姜', '蒜', '酱油', '醋', '糖', '淀粉', '料酒', '盐'],
    steps: [
      '茄子切条，用盐腌制10分钟后挤干水分',
      '调制鱼香汁：酱油、醋、糖、淀粉、水混合',
      '热锅多油，将茄子炸软后捞出',
      '锅中留底油，爆香葱姜蒜和豆瓣酱',
      '加入猪肉末炒至变色',
      '加入茄子翻炒均匀',
      '倒入鱼香汁，翻炒至汁液浓稠'
    ],
    flavorProfile: {
      savory: 4,
      sweet: 4,
      sour: 4,
      spicy: 3,
      umami: 4,
      bitter: 2
    },
    cookingTime: 30,
    difficulty: '中等',
    category: ['川菜', '素菜', '下饭菜']
  },
  {
    id: 'recipe-007',
    originalName: '清炒西兰花',
    displayName: '清炒西兰花',
    description: '健康营养的清淡蔬菜',
    ingredients: ['西兰花', '蒜', '盐', '油', '水'],
    steps: [
      '西兰花洗净切成小朵',
      '锅中烧水，加少许盐和油',
      '水开后放入西兰花焯水1分钟',
      '热锅冷油，爆香蒜末',
      '加入焯好水的西兰花快速翻炒',
      '加盐调味，翻炒均匀即可出锅'
    ],
    flavorProfile: {
      savory: 3,
      sweet: 2,
      sour: 1,
      spicy: 1,
      umami: 3,
      bitter: 3
    },
    cookingTime: 15,
    difficulty: '简单',
    category: ['素菜', '健康', '清淡']
  },
  {
    id: 'recipe-008',
    originalName: '红烧肉',
    displayName: '红烧肉',
    description: '肥而不腻，入口即化',
    ingredients: ['五花肉', '姜', '葱', '料酒', '冰糖', '酱油', '八角', '桂皮', '盐', '油'],
    steps: [
      '五花肉切块，冷水下锅焯水',
      '热锅冷油，加入冰糖炒出糖色',
      '加入五花肉翻炒上色',
      '加入料酒、酱油、八角、桂皮',
      '加入足够的水，放入姜片和葱结',
      '大火烧开后转小火炖1.5小时',
      '最后大火收汁，加盐调味'
    ],
    flavorProfile: {
      savory: 5,
      sweet: 4,
      sour: 1,
      spicy: 1,
      umami: 5,
      bitter: 1
    },
    cookingTime: 120,
    difficulty: '中等',
    category: ['经典', '肉类', '宴客菜']
  },
  {
    id: 'recipe-009',
    originalName: '酸辣土豆丝',
    displayName: '酸辣土豆丝',
    description: '酸辣开胃的家常小菜',
    ingredients: ['土豆', '干辣椒', '蒜', '醋', '盐', '糖', '油', '花椒'],
    steps: [
      '土豆切细丝，用水冲洗掉淀粉',
      '热锅冷油，爆香干辣椒、花椒和蒜末',
      '加入土豆丝快速翻炒',
      '沿锅边淋入醋，加盐和糖调味',
      '大火快速翻炒均匀即可出锅'
    ],
    flavorProfile: {
      savory: 3,
      sweet: 2,
      sour: 5,
      spicy: 4,
      umami: 2,
      bitter: 1
    },
    cookingTime: 15,
    difficulty: '简单',
    category: ['小菜', '酸辣', '素菜']
  },
  {
    id: 'recipe-010',
    originalName: '鸡汤',
    displayName: '鸡汤',
    description: '鲜美滋补的营养汤品',
    ingredients: ['鸡肉', '姜', '葱', '枸杞', '红枣', '盐', '料酒'],
    steps: [
      '鸡肉切块，冷水下锅焯水',
      '将焯好水的鸡肉放入汤锅',
      '加入足量冷水，放入姜片和葱结',
      '大火烧开后撇去浮沫',
      '转小火炖煮1.5小时',
      '加入枸杞和红枣继续炖30分钟',
      '最后加盐调味即可'
    ],
    flavorProfile: {
      savory: 4,
      sweet: 3,
      sour: 1,
      spicy: 1,
      umami: 5,
      bitter: 1
    },
    cookingTime: 120,
    difficulty: '简单',
    category: ['汤品', '营养', '滋补']
  }
]

// 食材分类
export const ingredientsByCategory = {
  蔬菜: ['西红柿', '土豆', '青椒', '洋葱', '大蒜', '生姜', '香菇', '胡萝卜', '西兰花', '黄瓜', '菠菜'],
  肉类: ['鸡肉', '牛肉', '猪肉', '鱼'],
  蛋奶: ['鸡蛋', '豆腐'],
  主食: ['米饭', '面条', '玉米'],
  调料: ['盐', '糖', '油', '酱油', '醋', '料酒', '淀粉', '花椒', '辣椒面', '八角']
}

// 获取所有食材
export const getAllIngredients = (): string[] => {
  const allIngredients = new Set<string>()
  recipes.forEach(recipe => {
    recipe.ingredients.forEach(ingredient => {
      allIngredients.add(ingredient)
    })
  })
  return Array.from(allIngredients)
}

// 根据ID获取菜谱
export const getRecipeById = (id: string): Recipe | undefined => {
  return recipes.find(recipe => recipe.id === id)
}

// 根据食材搜索菜谱
export const searchRecipesByIngredients = (ingredients: string[]): Recipe[] => {
  if (ingredients.length === 0) {
    return []
  }

  return recipes.filter(recipe => {
    const matchingIngredients = recipe.ingredients.filter(ingredient =>
      ingredients.some(selected =>
        ingredient.includes(selected) || selected.includes(ingredient)
      )
    )
    return matchingIngredients.length > 0
  })
}