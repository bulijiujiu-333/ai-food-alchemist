<template>
  <button
    :class="[
      'primary-button',
      size,
      { 
        'loading': loading,
        'disabled': disabled,
        'full-width': fullWidth,
        'with-icon': $slots.icon
      }
    ]"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <!-- 加载状态 -->
    <div v-if="loading" class="button-loader">
      <span class="loader-dot"></span>
      <span class="loader-dot"></span>
      <span class="loader-dot"></span>
    </div>
    
    <!-- 图标插槽 -->
    <slot v-else name="icon" class="button-icon"></slot>
    
    <!-- 按钮文字 -->
    <span class="button-text">
      <slot></slot>
    </span>
    
    <!-- 涟漪效果 -->
    <span v-if="rippleVisible" class="ripple-effect" :style="rippleStyle"></span>
  </button>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  size?: 'small' | 'medium' | 'large'
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
}

// 关键修复：将 defineProps 的返回值赋值给 props 变量
const props = withDefaults(defineProps<Props>(), {
  size: 'medium',
  loading: false,
  disabled: false,
  fullWidth: false
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

// 涟漪效果
const rippleVisible = ref(false)
const rippleX = ref(0)
const rippleY = ref(0)

const rippleStyle = {
  left: `${rippleX.value}px`,
  top: `${rippleY.value}px`
}

const handleClick = (event: MouseEvent) => {
  if (props.disabled || props.loading) return
  
  // 计算涟漪位置
  const button = event.currentTarget as HTMLElement
  const rect = button.getBoundingClientRect()
  rippleX.value = event.clientX - rect.left
  rippleY.value = event.clientY - rect.top
  
  // 显示涟漪
  rippleVisible.value = true
  setTimeout(() => {
    rippleVisible.value = false
  }, 600)
  
  emit('click', event)
}
</script>

<style lang="less" scoped>
@import '@/assets/styles/main.less';

.primary-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  background: @primary-gradient;
  border: none;
  border-radius: 50px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  min-width: 120px;
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
  
  // 尺寸变体
  &.small {
    padding: 8px 16px;
    font-size: 14px;
    min-width: 100px;
  }
  
  &.large {
    padding: 16px 32px;
    font-size: 18px;
    min-width: 140px;
  }
  
  // 状态
  &:hover:not(.disabled):not(.loading) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(255, 107, 107, 0.4);
  }
  
  &:active:not(.disabled):not(.loading) {
    transform: translateY(0);
    box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
  }
  
  &.disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
  }
  
  &.full-width {
    width: 100%;
  }
  
  // 加载动画
  .button-loader {
    display: flex;
    gap: 4px;
    
    .loader-dot {
      width: 8px;
      height: 8px;
      background: white;
      border-radius: 50%;
      animation: loaderBounce 1.4s infinite ease-in-out both;
      
      &:nth-child(1) { animation-delay: -0.32s; }
      &:nth-child(2) { animation-delay: -0.16s; }
      &:nth-child(3) { animation-delay: 0s; }
    }
  }
  
  .button-text {
    position: relative;
    z-index: 1;
  }
  
  // 涟漪效果
  .ripple-effect {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.6);
    transform: scale(0);
    animation: ripple 0.6s linear;
  }
}

@keyframes loaderBounce {
  0%, 80%, 100% { 
    transform: scale(0);
    opacity: 0.5;
  } 
  40% { 
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes ripple {
  to {
    transform: scale(4);
    opacity: 0;
  }
}
</style>