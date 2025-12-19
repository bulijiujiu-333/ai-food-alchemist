<template>
  <!-- 主背景容器 -->
  <div class="background-decorations" :class="{ 'home': isHomePage }">
    <!-- 背景渐变层 -->
    <div class="bg-gradient-layer"></div>
    
    <!-- 厨房用具装饰 -->
    <div class="kitchen-utensils">
      <div class="utensil spoon" :style="getUtensilStyle(0)">🥄</div>
      <div class="utensil fork" :style="getUtensilStyle(1)">🍴</div>
      <div class="utensil knife" :style="getUtensilStyle(2)">🔪</div>
      <div class="utensil pot" :style="getUtensilStyle(3)">🍲</div>
      <div class="utensil bowl" :style="getUtensilStyle(4)">🥣</div>
      <div class="utensil whisk" :style="getUtensilStyle(5)">🥢</div>
    </div>
    
    <!-- 浮动食材图标 -->
    <div class="floating-ingredients">
      <div class="ingredient" v-for="n in 12" :key="n" :style="getIngredientStyle(n)">
        {{ getRandomIngredientEmoji() }}
      </div>
    </div>
    
    <!-- 魔法粒子效果 -->
    <div class="magic-particles">
      <div class="particle" v-for="n in particleCount" :key="n" :style="getParticleStyle(n)"></div>
    </div>
    
    <!-- 网格线背景 -->
    <div class="grid-overlay"></div>
    
    <!-- 角落装饰 -->
    <div class="corner-decoration top-left">
      <div class="decoration-leaf leaf-1">🍃</div>
      <div class="decoration-leaf leaf-2">🌿</div>
    </div>
    <div class="corner-decoration top-right">
      <div class="decoration-star star-1">✨</div>
      <div class="decoration-star star-2">⭐</div>
    </div>
    <div class="corner-decoration bottom-left">
      <div class="decoration-herb herb-1">🌱</div>
      <div class="decoration-herb herb-2">🌾</div>
    </div>
    <div class="corner-decoration bottom-right">
      <div class="decoration-spice spice-1">🌶️</div>
      <div class="decoration-spice spice-2">🧂</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const particleCount = 25

// 判断是否在首页
const isHomePage = computed(() => route.path === '/')

// 食材emoji列表
const ingredientEmojis: readonly string[] = [
  '🍅', '🥚', '🥔', '🍗', '🥩', '🐷', '🐟', '🧈', '🍚', '🍜',
  '🫑', '🧅', '🧄', '🫚', '🍄', '🥕', '🥦', '🥒', '🥬', '🌽',
  '🍓', '🍋', '🍇', '🥑', '🍆', '🌶️', '🧄', '🧅', '🥜', '🌰'
]

// 获取随机食材emoji
const getRandomIngredientEmoji = (): string => {
  const randomIndex = Math.floor(Math.random() * ingredientEmojis.length)
  return ingredientEmojis[randomIndex] || '🥘'
}

// 生成厨具样式 - 修复pos可能为undefined的问题
const getUtensilStyle = (index: number) => {
  interface UtensilPosition {
    top: string
    left?: string
    right?: string
    size: string
  }

  const positions: UtensilPosition[] = [
    { top: '15%', left: '10%', size: '40px' },
    { top: '20%', right: '15%', size: '35px' },
    { top: '70%', left: '5%', size: '45px' },
    { top: '65%', right: '10%', size: '50px' },
    { top: '85%', left: '15%', size: '38px' },
    { top: '90%', right: '5%', size: '42px' }
  ]
  
  // 确保索引在数组范围内
  const safeIndex = Math.min(index, positions.length - 1)
  const pos = positions[safeIndex]!
  
  const rotation = Math.random() * 20 - 10
  const delay = index * 0.5
  
  return {
    top: pos.top,
    left: pos.left || 'auto',
    right: pos.right || 'auto',
    fontSize: pos.size,
    transform: `rotate(${rotation}deg)`,
    animationDelay: `${delay}s`
  }
}

// 生成浮动食材样式
const getIngredientStyle = (index: number) => {
  const left = Math.random() * 90+5
  const top = Math.random() * 90+5
  const size = 20 + Math.random() * 24
  const duration = 15 + Math.random() * 15
  const delay = Math.random() * 3
  const rotation = Math.random() * 720
  
  return {
    left: `${left}%`,
    top: `${top}%`,
    fontSize: `${size}px`,
    animationDuration: `${duration}s`,
    animationDelay: `${delay}s`,
    transform: `rotate(${rotation}deg)`,
    opacity: 0.15 + Math.random() * 0.15
  }
}

// 生成粒子样式
const getParticleStyle = (index: number) => {
  const left = Math.random() * 100
  const top = Math.random() * 100
  const size = 1 + Math.random() * 3
  const duration = 20 + Math.random() * 10
  const delay = Math.random() * 5
  const opacity = 0.1 + Math.random() * 0.2
  
  // 随机颜色 - 美食主题色系
  const colors: readonly string[] = [
    'rgba(255, 107, 107, VAR_OPACITY)',   // 主红色
    'rgba(255, 142, 83, VAR_OPACITY)',    // 橙色
    'rgba(255, 209, 102, VAR_OPACITY)',   // 金色
    'rgba(78, 205, 196, VAR_OPACITY)',    // 青色
    'rgba(157, 78, 221, VAR_OPACITY)',    // 紫色
    'rgba(42, 157, 143, VAR_OPACITY)'     // 绿色
  ]
  
  const randomIndex = Math.floor(Math.random() * colors.length)
  const colorTemplate = colors[randomIndex] || 'rgba(255, 107, 107, VAR_OPACITY)'
  const finalColor = colorTemplate.replace('VAR_OPACITY', opacity.toString())
  
  return {
    left: `${left}%`,
    top: `${top}%`,
    width: `${size}px`,
    height: `${size}px`,
    background: finalColor,
    animationDuration: `${duration}s`,
    animationDelay: `${delay}s`
  }
}

// 粒子动画控制
const animationActive = ref(true)

// 性能优化：页面不可见时暂停动画
const handleVisibilityChange = () => {
  animationActive.value = !document.hidden
}

onMounted(() => {
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<style lang="less" scoped>
@import '@/assets/styles/main.less';

.background-decorations {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: -1; // 确保在内容后面
  pointer-events: none; // 不干扰交互
  overflow: hidden;
  
  // 首页特殊背景
  &.home {
    .bg-gradient-layer {
      background: linear-gradient(
        135deg,
        rgba(255, 245, 240, 0.9) 0%,
        rgba(255, 250, 245, 0.8) 25%,
        rgba(240, 255, 250, 0.7) 50%,
        rgba(245, 240, 255, 0.8) 75%,
        rgba(255, 245, 240, 0.9) 100%
      );
    }
  }
  
  // 背景渐变层
  .bg-gradient-layer {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      135deg,
      rgba(248, 249, 250, 0.95) 0%,
      rgba(245, 247, 250, 0.9) 50%,
      rgba(248, 249, 250, 0.95) 100%
    );
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: 
        radial-gradient(circle at 20% 80%, rgba(255, 107, 107, 0.05) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(78, 205, 196, 0.05) 0%, transparent 50%),
        radial-gradient(circle at 40% 40%, rgba(255, 209, 102, 0.03) 0%, transparent 50%);
      background-size: 100% 100%;
    }
  }
  
  // 厨房用具
  .kitchen-utensils {
    .utensil {
      position: absolute;
      opacity: 0.15;
      animation: floatUtensil 20s ease-in-out infinite;
      filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.1));
      
      &.spoon { animation-delay: 0s; }
      &.fork { animation-delay: 2s; }
      &.knife { animation-delay: 4s; }
      &.pot { animation-delay: 6s; }
      &.bowl { animation-delay: 8s; }
      &.whisk { animation-delay: 10s; }
    }
  }
  
  // 浮动食材
  .floating-ingredients {
    .ingredient {
      position: absolute;
      opacity: 0.08;
      animation: floatIngredient linear infinite;
      will-change: transform;
      filter: drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.1));
    }
  }
  
  // 魔法粒子
  .magic-particles {
    .particle {
      position: absolute;
      border-radius: 50%;
      animation: floatParticle linear infinite;
      will-change: transform;
    }
  }
  
  // 网格线背景
  .grid-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
      linear-gradient(rgba(0, 0, 0, 0.02) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 0, 0, 0.02) 1px, transparent 1px);
    background-size: 50px 50px;
    opacity: 0.5;
    mask-image: radial-gradient(circle at center, black, transparent 70%);
  }
  
  // 角落装饰
  .corner-decoration {
    position: absolute;
    
    &.top-left {
      top: 20px;
      left: 20px;
    }
    
    &.top-right {
      top: 20px;
      right: 20px;
    }
    
    &.bottom-left {
      bottom: 20px;
      left: 20px;
    }
    
    &.bottom-right {
      bottom: 20px;
      right: 20px;
    }
    
    .decoration-leaf,
    .decoration-star,
    .decoration-herb,
    .decoration-spice {
      position: absolute;
      font-size: 24px;
      opacity: 0.2;
      animation: gentleSway 8s ease-in-out infinite;
      
      &.leaf-1 { animation-delay: 0s; }
      &.leaf-2 { 
        transform: translate(15px, 15px) rotate(45deg);
        animation-delay: 2s; 
      }
      
      &.star-1 { animation-delay: 1s; }
      &.star-2 { 
        transform: translate(-15px, 15px) rotate(-45deg);
        animation-delay: 3s; 
      }
      
      &.herb-1 { animation-delay: 0.5s; }
      &.herb-2 { 
        transform: translate(15px, -15px) rotate(30deg);
        animation-delay: 2.5s; 
      }
      
      &.spice-1 { animation-delay: 1.5s; }
      &.spice-2 { 
        transform: translate(-15px, -15px) rotate(-30deg);
        animation-delay: 3.5s; 
      }
    }
  }
}

// 动画定义
@keyframes floatUtensil {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  25% {
    transform: translateY(-10px) rotate(2deg);
  }
  50% {
    transform: translateY(-5px) rotate(0deg);
  }
  75% {
    transform: translateY(-15px) rotate(-2deg);
  }
}

@keyframes floatIngredient {
  0% {
    transform: translateY(0) rotate(0deg) scale(1);
    opacity: 0.1;
  }
  25% {
    transform: translateY(-40px) rotate(90deg) scale(1.2);  // 增大移动距离
    opacity: 0.3;  // 增加透明度变化
  }
  50% {
    transform: translateY(-80px) rotate(180deg) scale(1.4);  // 显著增大
    opacity: 0.25;
  }
  75% {
    transform: translateY(-40px) rotate(270deg) scale(1.2);
    opacity: 0.3;
  }
  100% {
    transform: translateY(0) rotate(360deg) scale(1);
    opacity: 0.1;
  }
}

@keyframes floatParticle {
  0% {
    transform: translateY(0) translateX(0) scale(1);
    opacity: 0;
  }
  10% {
    opacity: 0.1;
  }
  90% {
    opacity: 0.1;
  }
  100% {
    transform: translateY(-100vh) translateX(var(--tx, 50px)) scale(0.5);
    opacity: 0;
  }
}

@keyframes gentleSway {
  0%, 100% {
    transform: rotate(0deg) scale(1);
  }
  50% {
    transform: rotate(5deg) scale(1.05);
  }
}

// 性能优化
@media (prefers-reduced-motion: reduce) {
  .utensil,
  .ingredient,
  .particle,
  .decoration-leaf,
  .decoration-star,
  .decoration-herb,
  .decoration-spice {
    animation: none !important;
  }
}

// 响应式调整
@media (max-width: @breakpoint-tablet) {
  .background-decorations {
    // 移动端减少元素数量
    .utensil {
      display: none;
    }
    
    // 浮动食材
.floating-ingrssients {
  .ingredient {
    position: absolute;
    opacity: 0.2;  // 增加基础透明度
    animation: floatIngredient linear infinite;
    will-change: transform;
    filter: drop-shadow(2px 2px 6px rgba(0, 0, 0, 0.2));  // 增加阴影强度
    
    // 添加悬停效果
    &:hover {
      opacity: 0.4;
      filter: drop-shadow(3px 3px 8px rgba(0, 0, 0, 0.3));
    }
  }
}
    
    .corner-decoration {
      .decoration-leaf,
      .decoration-star,
      .decoration-herb,
      .decoration-spice {
        font-size: 18px;
      }
    }
    
    .grid-overlay {
      background-size: 30px 30px;
    }
  }
}

// 深色模式适配
@media (prefers-color-scheme: dark) {
  .background-decorations {
    .bg-gradient-layer {
      background: linear-gradient(
        135deg,
        rgba(30, 30, 40, 0.95) 0%,
        rgba(40, 40, 50, 0.9) 50%,
        rgba(30, 30, 40, 0.95) 100%
      );
      
      &::before {
        background-image: 
          radial-gradient(circle at 20% 80%, rgba(255, 107, 107, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(78, 205, 196, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(255, 209, 102, 0.08) 0%, transparent 50%);
      }
    }
    
    .grid-overlay {
      background-image: 
        linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
    }
    
    .utensil,
    .ingredient {
      filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3));
    }
  }
}
</style>