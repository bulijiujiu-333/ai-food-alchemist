<template>
  <button
    :class="[
      'ingredient-tag',
      size,
      { 
        'selected': selected,
        'removable': removable,
        'disabled': disabled
      }
    ]"
    :disabled="disabled"
    @click="handleClick"
  >
    <!-- 选中图标 -->
    <span v-if="selected" class="selected-icon">
      ✓
    </span>
    
    <!-- 标签内容 -->
    <span class="tag-content">
      <!-- 图标 -->
      <span class="tag-icon">{{ getIngredientIcon }}</span>
      
      <!-- 文字 -->
      <span class="tag-text">{{ ingredient }}</span>
      
      <!-- 移除按钮 -->
      <span v-if="removable && selected" class="remove-btn" @click.stop="handleRemove">
        ×
      </span>
    </span>
    
    <!-- 选中状态光晕 -->
    <div v-if="selected" class="selection-glow"></div>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  ingredient: string
  selected: boolean
  removable?: boolean
  disabled?: boolean
  size?: 'small' | 'medium' | 'large'
}

// 关键修复：将 defineProps 的返回值赋值给 props 变量
const props = withDefaults(defineProps<Props>(), {
  removable: false,
  disabled: false,
  size: 'medium'
})

const emit = defineEmits<{
  click: [ingredient: string]
  remove: [ingredient: string]
}>()

// 食材图标映射
const ingredientIcons: Record<string, string> = {
  '八角': '⭐',
  '冰糖': '🔸',
  '葱': '🌱',
  '醋': '🍶',
  '淀粉': '🌾',
  '豆瓣酱': '🌶️',
  '豆腐': '🧈',
  '干辣椒': '🔥',
  '枸杞': '🔴',
  '桂皮': '🟤',
  '红枣': '❤️',
  '胡萝卜': '🥕',
  '花椒': '🌶️',
  '花生米': '🥜',
  '鸡蛋': '🥚',
  '鸡肉': '🍗',
  '鸡胸肉': '🍗',
  '茄子': '🍆',
  '姜': '🟡',
  '酱油': '🫙',
  '辣椒面': '🌶️',
  '料酒': '🍷',
  '牛肉': '🥩',
  '青椒': '🫑',
  '水': '💧',
  '蒜': '🧄',
  '糖': '🍬',
  '土豆': '🥔',
  '五花肉': '🥓',
  '西红柿': '🍅'
}

const getIngredientIcon = computed(() => {
  return ingredientIcons[props.ingredient] || '🥘'
})

const handleClick = () => {
  if (props.disabled) return
  emit('click', props.ingredient)
}

const handleRemove = () => {
  emit('remove', props.ingredient)
}
</script>
<style lang="less" scoped>
@import '@/assets/styles/main.less';

.ingredient-tag {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 20px;
  color: #666;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  
  // 尺寸变体
  &.small {
    padding: 6px 12px;
    font-size: 12px;
    border-radius: 16px;
  }
  
  &.large {
    padding: 10px 20px;
    font-size: 16px;
    border-radius: 24px;
  }
  
  // 默认状态
  &:hover:not(.selected):not(.disabled) {
    border-color: @primary-color;
    color: @primary-color;
    transform: translateY(-2px);
    box-shadow: @shadow-sm;
  }
  
  // 选中状态
  &.selected {
    background: @primary-gradient;
    color: white;
    border-color: transparent;
    transform: translateY(-2px);
    box-shadow: @shadow-md;
    
    .tag-content {
      position: relative;
      z-index: 1;
    }
    
    .remove-btn {
      margin-left: 4px;
      width: 16px;
      height: 16px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      font-size: 12px;
      transition: background 0.2s;
      
      &:hover {
        background: rgba(255, 255, 255, 0.3);
      }
    }
  }
  
  // 禁用状态
  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
  }
  
  // 内容区域
  .selected-icon {
    font-size: 12px;
    animation: scaleIn 0.2s ease;
  }
  
  .tag-content {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  
  .tag-icon {
    font-size: 16px;
  }
  
  .tag-text {
    white-space: nowrap;
  }
  
  // 选中状态光晕
  .selection-glow {
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    border-radius: inherit;
    background: inherit;
    animation: pulseGlow 2s infinite;
    opacity: 0.5;
    z-index: 0;
  }
}

@keyframes scaleIn {
  from {
    transform: scale(0);
  }
  to {
    transform: scale(1);
  }
}

@keyframes pulseGlow {
  0%, 100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}
</style>