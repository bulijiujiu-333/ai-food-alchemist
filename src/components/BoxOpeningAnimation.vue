<template>
  <div v-if="visible" class="box-opening-overlay" @click.self="handleClose">
    <div class="animation-background"></div>
    
    <div class="animation-container">
      <!-- 标题 -->
      <div class="animation-header">
        <h2>✨ 美食炼金术 ✨</h2>
        <p>将平凡食材转化为美味奇迹</p>
      </div>
      
      <!-- 炼金锅动画 -->
      <div class="alchemy-cauldron" :class="{ 'active': isAnimating }">
        <div class="cauldron">
          <div class="liquid"></div>
          <div class="bubbles">
            <div class="bubble" v-for="n in 10" :key="n"></div>
          </div>
        </div>
        <div class="stand"></div>
        <div class="fire"></div>
      </div>
      
      <!-- 控制按钮 -->
      <div class="control-buttons">
        <PrimaryButton 
          @click="startAnimation" 
          :loading="isAnimating"
          :disabled="isAnimating || showResult"
          class="start-btn"
        >
          {{ isAnimating ? '炼金进行中...' : '开始炼金' }}
        </PrimaryButton>
        
        <button 
          v-if="isAnimating" 
          @click="skipAnimation" 
          class="skip-btn"
        >
          跳过动画
        </button>
      </div>
      
      <!-- 结果卡片 -->
      <div v-if="showResult" class="result-card">
        <div class="card-content">
          <h3>{{ resultRecipe?.displayName || '美味菜品' }}</h3>
          <div class="ingredients">
            <span 
              v-for="ing in resultRecipe?.ingredients?.slice(0, 5) || []" 
              :key="ing"
              class="ingredient-badge"
            >
              {{ ing }}
            </span>
          </div>
        </div>
      </div>
      
      <!-- 关闭按钮 -->
      <button class="close-btn" @click="handleClose">
        ✕
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import PrimaryButton from './PrimaryButton.vue'
import type { Recipe } from '@/types/recipe'

interface Props {
  visible: boolean
  ingredients: string[]
  resultRecipe?: Recipe
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  animationComplete: []
}>()

const isAnimating = ref(false)
const showResult = ref(false)

const startAnimation = () => {
  if (isAnimating.value) return
  
  isAnimating.value = true
  showResult.value = false
  
  // 模拟动画过程
  setTimeout(() => {
    showResult.value = true
    isAnimating.value = false
    emit('animationComplete')
  }, 3000)
}

const skipAnimation = () => {
  isAnimating.value = false
  showResult.value = true
  emit('animationComplete')
}

const handleClose = () => {
  if (isAnimating.value) return
  emit('close')
}
</script>

<style lang="less" scoped>
@import '@/assets/styles/main.less';

.box-opening-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
  
  .animation-background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, 
      rgba(255, 107, 107, 0.1),
      rgba(255, 142, 83, 0.1)
    );
  }
}

.animation-container {
  position: relative;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24px;
  padding: 40px;
  max-width: 500px;
  width: 90%;
  text-align: center;
  box-shadow: @shadow-xl;
  
  .animation-header {
    margin-bottom: 30px;
    
    h2 {
      font-size: 28px;
      color: @text-primary;
      margin-bottom: 8px;
      background: @primary-gradient;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    p {
      color: @text-secondary;
      font-size: 16px;
    }
  }
  
  .alchemy-cauldron {
    position: relative;
    height: 200px;
    margin: 30px 0;
    
    &.active {
      animation: float 3s ease-in-out infinite;
    }
    
    .cauldron {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 120px;
      height: 80px;
      background: linear-gradient(135deg, #8B4513, #A0522D);
      border-radius: 60px 60px 30px 30px;
      overflow: hidden;
      
      .liquid {
        position: absolute;
        bottom: 0;
        left: 5%;
        right: 5%;
        height: 70%;
        background: @primary-gradient;
        border-radius: 50px 50px 20px 20px;
        animation: liquidBubble 2s ease-in-out infinite;
      }
      
      .bubbles {
        .bubble {
          position: absolute;
          background: rgba(255, 255, 255, 0.6);
          border-radius: 50%;
          animation: bubbleRise 3s infinite ease-in-out;
          
          @for $i from 1 through 10 {
            &:nth-child(#{$i}) {
              left: random(80) + 10%;
              bottom: 10%;
              width: random(15) + 5px;
              height: width;
              animation-delay: random(2) + s;
            }
          }
        }
      }
    }
    
    .stand {
      position: absolute;
      top: 130px;
      left: 50%;
      transform: translateX(-50%);
      width: 140px;
      height: 10px;
      background: linear-gradient(135deg, #666, #888);
      border-radius: 5px;
    }
    
    .fire {
      position: absolute;
      top: 140px;
      left: 50%;
      transform: translateX(-50%);
      width: 40px;
      height: 20px;
      background: linear-gradient(to top, #ff6b6b, #ffd166);
      border-radius: 10px 10px 0 0;
      animation: fireFlicker 0.5s infinite alternate;
    }
  }
  
  .control-buttons {
    margin: 30px 0;
    
    .start-btn {
      margin-bottom: 15px;
    }
    
    .skip-btn {
      background: none;
      border: none;
      color: @text-secondary;
      font-size: 14px;
      cursor: pointer;
      text-decoration: underline;
      
      &:hover {
        color: @primary-color;
      }
    }
  }
  
  .result-card {
    background: white;
    border-radius: 16px;
    padding: 20px;
    margin-top: 20px;
    border: 2px solid @primary-color;
    animation: slideInUp 0.5s ease;
    
    .card-content {
      h3 {
        font-size: 20px;
        color: @text-primary;
        margin-bottom: 15px;
      }
      
      .ingredients {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        justify-content: center;
        
        .ingredient-badge {
          background: @background-light;
          padding: 6px 12px;
          border-radius: 15px;
          font-size: 12px;
          color: @text-secondary;
        }
      }
    }
  }
  
  .close-btn {
    position: absolute;
    top: 15px;
    right: 15px;
    width: 36px;
    height: 36px;
    background: @background-light;
    border: none;
    border-radius: 50%;
    font-size: 18px;
    color: @text-secondary;
    cursor: pointer;
    transition: all 0.3s;
    
    &:hover {
      background: @primary-color;
      color: white;
      transform: rotate(90deg);
    }
  }
}

// 动画定义
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes liquidBubble {
  0%, 100% { height: 70%; }
  50% { height: 75%; }
}

@keyframes bubbleRise {
  0% { 
    bottom: 10%; 
    opacity: 0; 
    transform: scale(0.5); 
  }
  50% { opacity: 0.8; }
  100% { 
    bottom: 90%; 
    opacity: 0; 
    transform: scale(1); 
  }
}

@keyframes fireFlicker {
  from { 
    transform: translateX(-50%) scaleY(1); 
    opacity: 0.8; 
  }
  to { 
    transform: translateX(-50%) scaleY(0.8); 
    opacity: 1; 
  }
}

@keyframes slideInUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

// 响应式
@media (max-width: 768px) {
  .animation-container {
    padding: 30px 20px;
    width: 95%;
    
    .animation-header h2 {
      font-size: 24px;
    }
    
    .alchemy-cauldron {
      height: 180px;
    }
  }
}
</style>