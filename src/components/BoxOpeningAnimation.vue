<template>
  <!-- 遮罩层 -->
  <div v-if="visible" class="box-opening-overlay" @click.self="handleClose">
    <!-- 背景粒子特效 -->
    <div class="particles-background">
      <div class="particle" v-for="n in particleCount" :key="n" 
           :style="getParticleStyle(n)"></div>
    </div>
    
    <!-- 主容器 -->
    <div class="animation-main-container">
      <!-- 标题 -->
      <div class="animation-title">
        <h2>✨ 美食炼金术 ✨</h2>
        <p class="subtitle">将食材转化为美味奇迹</p>
      </div>
      
      <!-- 炼金舞台 -->
      <div class="alchemy-stage">
        <!-- 炼金锅容器 -->
        <div class="cauldron-container" :class="{ 'active': isAnimating }">
          <!-- 锅体 -->
          <div class="cauldron">
            <!-- 锅液体 -->
            <div class="magic-liquid">
              <div class="liquid-surface"></div>
              <div class="liquid-glow"></div>
            </div>
            
            <!-- 气泡 -->
            <div class="bubbles">
              <div class="bubble" v-for="n in 15" :key="`bubble-${n}`" 
                   :style="getBubbleStyle(n)"></div>
            </div>
            
            <!-- 食材粒子 -->
            <div class="ingredient-particles">
              <div class="particle" v-for="(ingredient, idx) in displayedIngredients" 
                   :key="`ing-${idx}`" :style="getIngredientParticleStyle(idx)">
                {{ getIngredientEmoji(ingredient) }}
              </div>
            </div>
          </div>
          
          <!-- 锅支架 -->
          <div class="cauldron-stand"></div>
          
          <!-- 锅底火焰 -->
          <div class="fire-effect">
            <div class="flame flame-1"></div>
            <div class="flame flame-2"></div>
            <div class="flame flame-3"></div>
          </div>
        </div>
        
        <!-- 魔法符文环绕 -->
        <div class="magic-glyphs">
          <div class="glyph" v-for="n in 8" :key="`glyph-${n}`" 
               :style="getGlyphStyle(n)">{{ getGlyphChar(n) }}</div>
        </div>
        
        <!-- 星光特效 -->
        <div class="star-effects">
          <div class="star" v-for="n in 12" :key="`star-${n}`" 
               :style="getStarStyle(n)">✨</div>
        </div>
      </div>
      
      <!-- 进度指示器 -->
      <div class="progress-section" v-if="isAnimating">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
        </div>
        <div class="progress-steps">
          <span class="step" :class="{ 'active': currentStep >= 1 }">准备食材</span>
          <span class="step" :class="{ 'active': currentStep >= 2 }">魔法融合</span>
          <span class="step" :class="{ 'active': currentStep >= 3 }">风味调和</span>
          <span class="step" :class="{ 'active': currentStep >= 4 }">成果显现</span>
        </div>
      </div>
      
      <!-- 结果展示区域 -->
      <div class="result-section" v-if="showResult">
        <div class="result-card" :class="{ 'revealed': showResult }">
          <div class="card-inner">
            <!-- 卡片正面（神秘面） -->
            <div class="card-front">
              <div class="mystery-content">
                <div class="spinning-star">⭐</div>
                <p class="mystery-text">美味正在生成中...</p>
              </div>
            </div>
            
            <!-- 卡片背面（结果面） -->
            <div class="card-back">
              <div class="recipe-result">
                <h3 class="recipe-name">{{ resultRecipe?.displayName || '神秘美食' }}</h3>
                <p class="recipe-original">{{ resultRecipe?.originalName || '传统佳肴' }}</p>
                
                <div class="recipe-meta">
                  <span class="meta-item">
                    <span class="meta-icon">⏱️</span>
                    <span>{{ resultRecipe?.cookingTime || 15 }}分钟</span>
                  </span>
                  <span class="meta-item">
                    <span class="meta-icon">🔥</span>
                    <span>{{ resultRecipe?.difficulty || '简单' }}</span>
                  </span>
                </div>
                
                <div class="ingredients-preview">
                  <h4>主要食材</h4>
                  <div class="ingredients-tags">
                    <span class="ingredient-tag" 
                          v-for="(ing, idx) in displayedRecipeIngredients" 
                          :key="idx">{{ ing }}</span>
                  </div>
                </div>
                
                <div v-if="resultRecipe?.story" class="recipe-story">
                  <p>{{ resultRecipe.story }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 控制按钮 -->
      <div class="control-section">
        <PrimaryButton
          v-if="!isAnimating && !showResult"
          @click="startAnimation"
          size="large"
          class="start-button"
        >
          <template #icon>
            🎯
          </template>
          开始炼金
        </PrimaryButton>
        
        <PrimaryButton
          v-if="isAnimating"
          @click="skipAnimation"
          variant="outline"
          class="skip-button"
        >
          跳过动画
        </PrimaryButton>
        
        <PrimaryButton
          v-if="showResult && !isAnimating"
          @click="handleClose"
          class="close-button"
        >
          完成
        </PrimaryButton>
      </div>
      
      <!-- 提示信息 -->
      <div class="hint-section" v-if="!isAnimating && !showResult">
        <p class="hint-text">选择了 {{ ingredients.length }} 种食材，点击开始炼金</p>
      </div>
    </div>
    
    <!-- 关闭按钮 -->
    <button class="global-close-btn" @click="handleClose" v-if="!isAnimating">
      <span class="close-icon">×</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import PrimaryButton from './PrimaryButton.vue'
import type { Recipe } from '@/types/recipe'

// 组件属性
interface Props {
  visible: boolean
  ingredients: string[]
  resultRecipe?: Recipe
}

const props = withDefaults(defineProps<Props>(), {
  ingredients: () => []
})

// 事件定义
const emit = defineEmits<{
  'close': []
  'animation-complete': []
}>()

// 动画状态
const isAnimating = ref(false)
const showResult = ref(false)
const currentStep = ref(0)
const progress = ref(0)

// 配置
const particleCount = 30
const animationDuration = 4000 // 4秒动画

// 计算属性
const displayedIngredients = computed(() => {
  return props.ingredients.slice(0, 5) // 最多显示5种食材
})

const displayedRecipeIngredients = computed(() => {
  return props.resultRecipe?.ingredients?.slice(0, 5) || []
})

// 食材转emoji
const getIngredientEmoji = (ingredient: string): string => {
  const emojiMap: Record<string, string> = {
    '鸡蛋': '🥚', '西红柿': '🍅', '土豆': '🥔', '鸡肉': '🍗', '牛肉': '🥩',
    '猪肉': '🐷', '鱼': '🐟', '豆腐': '🧈', '米饭': '🍚', '面条': '🍜',
    '青椒': '🫑', '洋葱': '🧅', '大蒜': '🧄', '生姜': '🫚', '香菇': '🍄',
    '胡萝卜': '🥕', '西兰花': '🥦', '黄瓜': '🥒', '菠菜': '🥬', '玉米': '🌽',
    '盐': '🧂', '糖': '🍬', '油': '🛢️', '酱油': '🥫', '醋': '🍶', '料酒': '🍺'
  }
  return emojiMap[ingredient] || '🥘'
}

// 开始动画
const startAnimation = async () => {
  if (isAnimating.value) return
  
  isAnimating.value = true
  showResult.value = false
  currentStep.value = 0
  progress.value = 0
  
  // 动画步骤
  const steps = [
    { step: 1, duration: 800, progress: 25 },   // 准备食材
    { step: 2, duration: 1200, progress: 50 },  // 魔法融合
    { step: 3, duration: 1000, progress: 75 },  // 风味调和
    { step: 4, duration: 1000, progress: 100 }, // 成果显现
  ]
  
  for (const { step, duration, progress: stepProgress } of steps) {
    await new Promise(resolve => setTimeout(resolve, duration))
    currentStep.value = step
    progress.value = stepProgress
  }
  
  // 显示结果
  showResult.value = true
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // 动画完成
  isAnimating.value = false
  emit('animation-complete')
}

// 跳过动画
const skipAnimation = () => {
  isAnimating.value = false
  currentStep.value = 4
  progress.value = 100
  showResult.value = true
  emit('animation-complete')
}

// 关闭弹窗
const handleClose = () => {
  if (isAnimating.value) return
  emit('close')
}

// 样式生成函数
const getParticleStyle = (index: number) => {
  const size = Math.random() * 4 + 2
  const left = Math.random() * 100
  const top = Math.random() * 100
  const duration = 3 + Math.random() * 2
  
  return {
    width: `${size}px`,
    height: `${size}px`,
    left: `${left}%`,
    top: `${top}%`,
    animationDuration: `${duration}s`,
    animationDelay: `${Math.random() * 2}s`
  }
}

const getBubbleStyle = (index: number) => {
  const size = Math.random() * 15 + 8
  const left = Math.random() * 70 + 15
  const delay = Math.random() * 2
  
  return {
    width: `${size}px`,
    height: `${size}px`,
    left: `${left}%`,
    animationDelay: `${delay}s`,
    opacity: isAnimating.value && currentStep.value >= 2 ? 1 : 0
  }
}

const getIngredientParticleStyle = (index: number) => {
  const angle = (index * 72) * Math.PI / 180 // 5个粒子均匀分布
  const radius = 60 + Math.random() * 20
  const x = 50 + radius * Math.cos(angle)
  const y = 50 + radius * Math.sin(angle)
  const delay = index * 0.2
  
  return {
    left: `${x}%`,
    top: `${y}%`,
    fontSize: `${16 + Math.random() * 8}px`,
    animationDelay: `${delay}s`,
    opacity: isAnimating.value && currentStep.value >= 1 ? 1 : 0
  }
}

const getGlyphStyle = (index: number) => {
  const angle = (index * 45) * Math.PI / 180
  const radius = 140 + Math.random() * 40
  const x = 50 + radius * Math.cos(angle)
  const y = 50 + radius * Math.sin(angle)
  
  return {
    left: `${x}%`,
    top: `${y}%`,
    fontSize: `${20 + Math.random() * 8}px`,
    animationDelay: `${index * 0.15}s`,
    opacity: isAnimating.value && currentStep.value >= 3 ? 0.8 : 0
  }
}

const getStarStyle = (index: number) => {
  const left = Math.random() * 80 + 10
  const top = Math.random() * 80 + 10
  const size = 12 + Math.random() * 12
  
  return {
    left: `${left}%`,
    top: `${top}%`,
    fontSize: `${size}px`,
    animationDelay: `${Math.random() * 2}s`,
    opacity: isAnimating.value && currentStep.value >= 4 ? 0.7 : 0
  }
}

const getGlyphChar = (index: number): string => {
  const glyphs = ['⚡', '✨', '🔥', '❄️', '💧', '🌿', '⭐', '🌀'];
  // 兜底1：若数组为空，返回默认字符
  if (glyphs.length === 0) return '✨';
  // 兜底2：若取模后索引对应的值异常，返回默认字符
  return glyphs[index % glyphs.length] || '✨';
};

// 键盘快捷键支持
const handleKeydown = (e: KeyboardEvent) => {
  if (!props.visible) return
  
  switch (e.key) {
    case 'Escape':
      if (!isAnimating.value) handleClose()
      break
    case 'Enter':
    case ' ':
      if (!isAnimating.value && !showResult.value) startAnimation()
      break
    case 's':
    case 'S':
      if (isAnimating.value) skipAnimation()
      break
  }
}

// 生命周期
onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style lang="less" scoped>
@import '@/assets/styles/main.less';

.box-opening-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  animation: fadeIn 0.3s ease;
  
  .particles-background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    
    .particle {
      position: absolute;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 50%;
      animation: floatParticle linear infinite;
      
      @keyframes floatParticle {
        0% {
          transform: translateY(0) rotate(0deg);
          opacity: 0;
        }
        10% {
          opacity: 0.5;
        }
        90% {
          opacity: 0.5;
        }
        100% {
          transform: translateY(-100px) rotate(180deg);
          opacity: 0;
        }
      }
    }
  }
}

.animation-main-container {
  position: relative;
  width: 90%;
  max-width: 600px;
  background: rgba(20, 20, 30, 0.9);
  border-radius: 24px;
  padding: 40px;
  text-align: center;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  animation: slideInUp 0.5s ease;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      135deg,
      rgba(255, 107, 107, 0.1),
      rgba(255, 142, 83, 0.1),
      rgba(78, 205, 196, 0.1)
    );
    border-radius: inherit;
    pointer-events: none;
  }
}

.animation-title {
  margin-bottom: 30px;
  
  h2 {
    font-size: 32px;
    color: white;
    margin-bottom: 10px;
    text-shadow: 0 4px 20px rgba(255, 255, 255, 0.3);
    animation: pulse 2s infinite;
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.8; }
    }
  }
  
  .subtitle {
    color: rgba(255, 255, 255, 0.7);
    font-size: 16px;
  }
}

.alchemy-stage {
  position: relative;
  height: 280px;
  margin: 30px 0;
  
  .cauldron-container {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    
    &.active {
      animation: floatCauldron 3s ease-in-out infinite;
      
      @keyframes floatCauldron {
        0%, 100% { transform: translate(-50%, -50%) translateY(0); }
        50% { transform: translate(-50%, -50%) translateY(-10px); }
      }
    }
    
    .cauldron {
      position: relative;
      width: 140px;
      height: 100px;
      background: linear-gradient(135deg, #3d2418, #2c1810);
      border-radius: 70px 70px 35px 35px;
      overflow: hidden;
      box-shadow: 
        0 10px 30px rgba(0, 0, 0, 0.4),
        inset 0 5px 15px rgba(255, 255, 255, 0.1);
      
      .magic-liquid {
        position: absolute;
        bottom: 0;
        left: 5%;
        right: 5%;
        height: 70%;
        background: linear-gradient(to top, #ff6b6b, #ff8e53, #ffd166);
        border-radius: 60px 60px 25px 25px;
        overflow: hidden;
        
        .liquid-surface {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 10px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.4),
            transparent
          );
          animation: liquidWave 2s infinite linear;
          
          @keyframes liquidWave {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        }
        
        .liquid-glow {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(
            circle at center,
            rgba(255, 255, 255, 0.3),
            transparent 70%
          );
          animation: glowPulse 2s infinite alternate;
          
          @keyframes glowPulse {
            from { opacity: 0.3; }
            to { opacity: 0.6; }
          }
        }
      }
    }
    
    .cauldron-stand {
      position: absolute;
      top: 100px;
      left: 50%;
      transform: translateX(-50%);
      width: 160px;
      height: 12px;
      background: linear-gradient(135deg, #555, #777);
      border-radius: 6px;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    }
    
    .fire-effect {
      position: absolute;
      top: 112px;
      left: 50%;
      transform: translateX(-50%);
      width: 50px;
      height: 25px;
      
      .flame {
        position: absolute;
        bottom: 0;
        background: linear-gradient(to top, #ff6b6b, #ffd166);
        border-radius: 50%;
        animation: flameFlicker 0.5s infinite alternate;
        
        &.flame-1 {
          left: 10px;
          width: 16px;
          height: 25px;
          animation-delay: 0s;
        }
        
        &.flame-2 {
          left: 22px;
          width: 20px;
          height: 30px;
          animation-delay: 0.2s;
        }
        
        &.flame-3 {
          left: 34px;
          width: 14px;
          height: 22px;
          animation-delay: 0.4s;
        }
        
        @keyframes flameFlicker {
          from {
            transform: scaleY(1);
            opacity: 0.8;
          }
          to {
            transform: scaleY(0.8);
            opacity: 1;
          }
        }
      }
    }
  }
  
  .bubbles {
    .bubble {
      position: absolute;
      background: rgba(255, 255, 255, 0.7);
      border-radius: 50%;
      bottom: 20%;
      animation: bubbleRise 3s infinite ease-in-out;
      
      @keyframes bubbleRise {
        0% {
          bottom: 20%;
          transform: scale(0.5);
          opacity: 0;
        }
        20% {
          opacity: 0.8;
        }
        80% {
          opacity: 0.8;
        }
        100% {
          bottom: 90%;
          transform: scale(1);
          opacity: 0;
        }
      }
    }
  }
  
  .ingredient-particles {
    .particle {
      position: absolute;
      font-size: 20px;
      transform: translate(-50%, -50%);
      animation: particleOrbit 2s ease-out forwards;
      filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
      
      @keyframes particleOrbit {
        0% {
          transform: translate(-50%, -50%) scale(0) rotate(0deg);
          opacity: 0;
        }
        20% {
          opacity: 1;
        }
        80% {
          opacity: 1;
        }
        100% {
          transform: translate(-50%, -50%) scale(1) rotate(360deg);
          opacity: 0;
        }
      }
    }
  }
  
  .magic-glyphs {
    .glyph {
      position: absolute;
      font-size: 24px;
      transform: translate(-50%, -50%);
      opacity: 0;
      animation: glyphFloat 4s linear infinite;
      
      @keyframes glyphFloat {
        0% {
          transform: translate(-50%, -50%) rotate(0deg);
          opacity: 0;
        }
        25%, 75% {
          opacity: 0.8;
        }
        100% {
          transform: translate(-50%, -50%) rotate(360deg);
          opacity: 0;
        }
      }
    }
  }
  
  .star-effects {
    .star {
      position: absolute;
      opacity: 0;
      animation: starTwinkle 3s infinite ease-in-out;
      
      @keyframes starTwinkle {
        0%, 100% {
          opacity: 0;
          transform: scale(0.8);
        }
        50% {
          opacity: 0.7;
          transform: scale(1.2);
        }
      }
    }
  }
}

.progress-section {
  margin: 25px 0;
  
  .progress-bar {
    height: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 12px;
    
    .progress-fill {
      height: 100%;
      background: @primary-gradient;
      border-radius: 4px;
      transition: width 0.5s ease;
      box-shadow: 0 0 20px rgba(255, 107, 107, 0.5);
    }
  }
  
  .progress-steps {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.6);
    
    .step {
      flex: 1;
      text-align: center;
      padding: 0 5px;
      transition: all 0.3s ease;
      
      &.active {
        color: white;
        font-weight: 600;
        text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
      }
      
      &:not(:last-child)::after {
        content: '→';
        margin-left: 10px;
        opacity: 0.3;
      }
    }
  }
}

.result-section {
  margin: 30px 0;
  
  .result-card {
    position: relative;
    width: 300px;
    height: 200px;
    margin: 0 auto;
    perspective: 1000px;
    
    .card-inner {
      position: relative;
      width: 100%;
      height: 100%;
      transition: transform 0.8s;
      transform-style: preserve-3d;
      
      .card-front,
      .card-back {
        position: absolute;
        width: 100%;
        height: 100%;
        backface-visibility: hidden;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .card-front {
        background: linear-gradient(135deg, 
          rgba(102, 126, 234, 0.8), 
          rgba(118, 75, 162, 0.8)
        );
        border: 2px solid rgba(255, 255, 255, 0.3);
        
        .mystery-content {
          text-align: center;
          
          .spinning-star {
            font-size: 48px;
            margin-bottom: 15px;
            animation: spin 2s linear infinite;
            
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          }
          
          .mystery-text {
            color: white;
            font-size: 16px;
            opacity: 0.9;
          }
        }
      }
      
      .card-back {
        background: white;
        transform: rotateY(180deg);
        padding: 20px;
        text-align: left;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        
        .recipe-result {
          width: 100%;
          
          .recipe-name {
            font-size: 20px;
            color: @text-primary;
            margin-bottom: 5px;
            background: @primary-gradient;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          
          .recipe-original {
            font-size: 14px;
            color: @text-secondary;
            font-style: italic;
            margin-bottom: 15px;
          }
          
          .recipe-meta {
            display: flex;
            gap: 20px;
            margin-bottom: 15px;
            
            .meta-item {
              display: flex;
              align-items: center;
              gap: 6px;
              font-size: 13px;
              color: @text-secondary;
              
              .meta-icon {
                font-size: 14px;
              }
            }
          }
          
          .ingredients-preview {
            h4 {
              font-size: 14px;
              color: @text-secondary;
              margin-bottom: 8px;
            }
            
            .ingredients-tags {
              display: flex;
              flex-wrap: wrap;
              gap: 6px;
              
              .ingredient-tag {
                background: @background-light;
                padding: 4px 10px;
                border-radius: 12px;
                font-size: 12px;
                color: @text-secondary;
              }
            }
          }
          
          .recipe-story {
            margin-top: 15px;
            padding: 10px;
            background: linear-gradient(135deg, #fff9c4, #fffde7);
            border-radius: 8px;
            border-left: 3px solid #ffd54f;
            
            p {
              font-size: 12px;
              color: #5d4037;
              line-height: 1.4;
              margin: 0;
            }
          }
        }
      }
    }
    
    &.revealed .card-inner {
      transform: rotateY(180deg);
    }
  }
}

.control-section {
  margin: 25px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  
  .start-button {
    animation: pulseButton 2s infinite;
    
    @keyframes pulseButton {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
  }
  
  .skip-button,
  .close-button {
    min-width: 140px;
  }
}

.hint-section {
  margin-top: 20px;
  
  .hint-text {
    color: rgba(255, 255, 255, 0.7);
    font-size: 14px;
  }
}

.global-close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  color: white;
  font-size: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: rotate(90deg);
  }
  
  .close-icon {
    display: block;
    line-height: 1;
  }
}

// 响应式设计
@media (max-width: @breakpoint-tablet) {
  .animation-main-container {
    width: 95%;
    padding: 30px 20px;
  }
  
  .animation-title h2 {
    font-size: 24px;
  }
  
  .alchemy-stage {
    height: 220px;
    
    .cauldron-container .cauldron {
      width: 110px;
      height: 80px;
    }
  }
  
  .result-card {
    width: 260px !important;
    height: 180px !important;
  }
}

@media (max-width: 480px) {
  .animation-main-container {
    padding: 25px 15px;
  }
  
  .animation-title h2 {
    font-size: 20px;
  }
  
  .alchemy-stage {
    height: 200px;
    
    .cauldron-container .cauldron {
      width: 90px;
      height: 65px;
    }
  }
  
  .result-card {
    width: 240px !important;
    height: 160px !important;
  }
  
  .progress-steps {
    font-size: 12px !important;
  }
}

// 基础动画
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideInUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>