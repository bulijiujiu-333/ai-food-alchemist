<template>
  <div id="app">
    <!-- 全局导航栏 -->
    <div v-if="showNavBar" class="global-nav">
      <button v-if="showBackButton" @click="handleBack" class="nav-back-btn">
        <div class="back-icon"></div>
      </button>
      
      <h1 class="nav-title">{{ navTitle }}</h1>
      
      <router-link to="/favorites" class="nav-favorite-btn">
        <div class="star-icon"></div>
        <span v-if="favoritesCount > 0" class="favorite-badge">
          {{ favoritesCount }}
        </span>
      </router-link>
    </div>
    
    <!-- 主要内容区域 -->
    <main :class="['main-content', { 'with-nav': showNavBar }]">
      <!-- 路由切换动画 -->
      <router-view v-slot="{ Component, route }">
        <transition
          :name="route.meta.transition || 'fade'"
          mode="out-in"
          @before-enter="beforeEnter"
          @after-enter="afterEnter"
        >
          <component :is="Component" :key="route.path" />
        </transition>
      </router-view>
    </main>
    
    <!-- 全局加载动画 -->
    <div v-if="globalLoading" class="global-loading-overlay">
      <div class="loading-content">
        <div class="alchemy-loading">
          <!-- 炼金锅 -->
          <div class="alchemy-pot">
            <div class="pot-body">
              <div class="magic-liquid"></div>
              <div class="bubble bubble-1"></div>
              <div class="bubble bubble-2"></div>
              <div class="bubble bubble-3"></div>
            </div>
            <div class="pot-lid">
              <div class="lid-knob"></div>
            </div>
            <div class="pot-stand"></div>
          </div>
          
          <!-- 周围漂浮的食材 -->
          <div class="floating-ingredients">
            <span class="ingredient" v-for="item in floatingItems" :key="item.id" :style="item.style">
              {{ item.text }}
            </span>
          </div>
          
          <!-- 加载文字 -->
          <div class="loading-text">
            <span class="text-char" v-for="(char, index) in loadingText" :key="index" :style="{ animationDelay: `${index * 0.1}s` }">
              {{ char }}
            </span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 全局背景装饰 -->
    <div class="background-decorations">
      <div class="decoration decoration-1"></div>
      <div class="decoration decoration-2"></div>
      <div class="decoration decoration-3"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRecipeStore } from '@/stores/recipe'

const route = useRoute()
const router = useRouter()
const recipeStore = useRecipeStore()

// 响应式数据
const globalLoading = ref(false)
const navTitle = ref('AI美食炼金术师')
const loadingText = '美食炼金中...'.split('')
const floatingItems = ref<any[]>([])

// 计算属性
const showNavBar = computed(() => route.name !== 'home')
const showBackButton = computed(() => route.name !== 'home')
const favoritesCount = computed(() => recipeStore.favorites.length)

// 创建漂浮食材
const createFloatingItems = () => {
  const ingredients = ['🍅', '🥚', '🥔', '🐔', '🐮', '🐷', '🐟', '🥦', '🌽', '🧅', '🧄', '🥕']
  const items = []
  
  for (let i = 0; i < 8; i++) {
    items.push({
      id: i,
      text: ingredients[Math.floor(Math.random() * ingredients.length)],
      style: {
        left: `${Math.random() * 90 + 5}%`,
        top: `${Math.random() * 90 + 5}%`,
        animationDelay: `${Math.random() * 2}s`,
        fontSize: `${Math.random() * 10 + 16}px`,
        opacity: Math.random() * 0.5 + 0.3
      }
    })
  }
  
  floatingItems.value = items
}

// 页面切换动画
const beforeEnter = () => {
  document.body.classList.add('page-transitioning')
}

const afterEnter = () => {
  setTimeout(() => {
    document.body.classList.remove('page-transitioning')
  }, 300)
}

// 返回按钮
const handleBack = () => {
  router.back()
}

// 模拟全局加载
const simulateLoading = () => {
  globalLoading.value = true
  setTimeout(() => {
    globalLoading.value = false
  }, 2000)
}

// 初始化
onMounted(() => {
  createFloatingItems()
  
  // 监听路由变化更新标题
  const unwatch = router.afterEach((to) => {
    navTitle.value = (to.meta.title as string) || 'AI美食炼金术师'
    
    // 页面切换时模拟加载（开发用）
    if (import.meta.env.DEV) {
      // simulateLoading()
    }
  })
  
  onUnmounted(() => {
    unwatch()
  })
})
</script>

<style lang="less">
@import '@/assets/styles/main.less';

#app {
  min-height: 100vh;
  position: relative;
  background: linear-gradient(135deg, #fdfcfb 0%, #f5f7fa 100%);
  overflow-x: hidden;
}

// ============================================
// 全局导航栏样式
// ============================================
.global-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 107, 107, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 @spacing-md;
  z-index: 1000;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.05);
  
  .nav-back-btn {
    width: 40px;
    height: 40px;
    border: none;
    background: @background-light;
    border-radius: @radius-full;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all @transition-normal;
    
    .back-icon {
      width: 12px;
      height: 12px;
      border-left: 2px solid @text-primary;
      border-bottom: 2px solid @text-primary;
      transform: rotate(45deg);
      margin-left: 4px;
    }
    
    &:hover {
      background: @primary-gradient;
      transform: translateX(-2px);
      
      .back-icon {
        border-color: white;
      }
    }
    
    &:active {
      transform: translateX(0) scale(0.95);
    }
  }
  
  .nav-title {
    font-size: @font-size-lg;
    font-weight: 600;
    color: @text-primary;
    margin: 0;
    background: @primary-gradient;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: -0.5px;
  }
  
  .nav-favorite-btn {
    width: 40px;
    height: 40px;
    background: @background-light;
    border-radius: @radius-full;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    text-decoration: none;
    transition: all @transition-normal;
    
    .star-icon {
      width: 20px;
      height: 20px;
      background: @primary-gradient;
      clip-path: polygon(
        50% 0%,
        61% 35%,
        98% 35%,
        68% 57%,
        79% 91%,
        50% 70%,
        21% 91%,
        32% 57%,
        2% 35%,
        39% 35%
      );
    }
    
    &:hover {
      background: @primary-gradient;
      transform: scale(1.1);
      
      .star-icon {
        background: white;
      }
    }
    
    .favorite-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      background: @primary-color;
      color: white;
      font-size: @font-size-xs;
      min-width: 18px;
      height: 18px;
      border-radius: @radius-full;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 4px;
      font-weight: 600;
      animation: pulse 2s infinite;
    }
  }
}

// ============================================
// 主要内容区域
// ============================================
.main-content {
  min-height: 100vh;
  padding-top: 56px; /* 导航栏高度 */
  
  &.with-nav {
    padding-top: 56px;
  }
}

// ============================================
// 页面过渡动画
// ============================================
.fade-enter-active,
.fade-leave-active {
  transition: opacity @transition-normal ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all @transition-normal ease;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

// 页面切换时的全局效果
.page-transitioning {
  pointer-events: none;
  
  * {
    transition: all @transition-normal !important;
  }
}

// ============================================
// 全局加载动画
// ============================================
.global-loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn @transition-normal ease;
  
  .loading-content {
    text-align: center;
    max-width: 300px;
  }
  
  .alchemy-loading {
    position: relative;
    height: 200px;
  }
  
  // 炼金锅样式
  .alchemy-pot {
    position: relative;
    width: 120px;
    height: 120px;
    margin: 0 auto;
    
    .pot-body {
      position: absolute;
      top: 30px;
      left: 50%;
      transform: translateX(-50%);
      width: 100px;
      height: 70px;
      background: linear-gradient(135deg, #8B4513, #A0522D);
      border-radius: 50px 50px 30px 30px;
      overflow: hidden;
      box-shadow: 0 8px 20px rgba(139, 69, 19, 0.3);
      
      .magic-liquid {
        position: absolute;
        bottom: 0;
        left: 5%;
        right: 5%;
        height: 60%;
        background: @primary-gradient;
        border-radius: 40px 40px 20px 20px;
        animation: liquidBubble 2s ease-in-out infinite;
        
        @keyframes liquidBubble {
          0%, 100% { height: 60%; }
          50% { height: 65%; }
        }
      }
      
      .bubble {
        position: absolute;
        background: rgba(255, 255, 255, 0.8);
        border-radius: 50%;
        animation: bubbleRise 3s infinite ease-in-out;
        
        @keyframes bubbleRise {
          0% { bottom: 10%; opacity: 0; transform: scale(0.5); }
          50% { opacity: 0.8; }
          100% { bottom: 90%; opacity: 0; transform: scale(1); }
        }
        
        &.bubble-1 {
          width: 12px;
          height: 12px;
          left: 30%;
          animation-delay: 0s;
        }
        
        &.bubble-2 {
          width: 8px;
          height: 8px;
          left: 50%;
          animation-delay: 0.5s;
        }
        
        &.bubble-3 {
          width: 6px;
          height: 6px;
          left: 70%;
          animation-delay: 1s;
        }
      }
    }
    
    .pot-lid {
      position: absolute;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      width: 110px;
      height: 20px;
      background: linear-gradient(135deg, #D2691E, #8B4513);
      border-radius: 55px 55px 10px 10px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
      
      .lid-knob {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 16px;
        height: 16px;
        background: @accent-color;
        border-radius: 50%;
      }
    }
    
    .pot-stand {
      position: absolute;
      top: 100px;
      left: 50%;
      transform: translateX(-50%);
      width: 120px;
      height: 8px;
      background: linear-gradient(135deg, #696969, #808080);
      border-radius: @radius-sm;
    }
  }
  
  // 漂浮食材
  .floating-ingredients {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    
    .ingredient {
      position: absolute;
      font-size: 24px;
      animation: float 4s ease-in-out infinite;
      filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
    }
  }
  
  // 加载文字
  .loading-text {
    margin-top: @spacing-xl;
    font-size: @font-size-lg;
    color: @text-secondary;
    display: flex;
    justify-content: center;
    gap: 2px;
    
    .text-char {
      display: inline-block;
      animation: bounce 0.5s infinite alternate;
      
      @keyframes bounce {
        from { transform: translateY(0); }
        to { transform: translateY(-5px); }
      }
    }
  }
}

// ============================================
// 背景装饰
// ============================================
.background-decorations {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: -1;
  overflow: hidden;
  
  .decoration {
    position: absolute;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(255, 107, 107, 0.1), rgba(255, 142, 83, 0.05));
    filter: blur(40px);
    
    &.decoration-1 {
      top: 10%;
      right: 10%;
      width: 300px;
      height: 300px;
      animation: float 6s ease-in-out infinite;
    }
    
    &.decoration-2 {
      bottom: 20%;
      left: 5%;
      width: 200px;
      height: 200px;
      animation: float 8s ease-in-out infinite reverse;
    }
    
    &.decoration-3 {
      top: 50%;
      right: 20%;
      width: 150px;
      height: 150px;
      animation: float 10s ease-in-out infinite;
    }
  }
}

// ============================================
// 响应式适配
// ============================================
@media (max-width: @breakpoint-tablet) {
  .global-nav {
    height: 52px;
    padding: 0 @spacing-sm;
    
    .nav-title {
      font-size: @font-size-md;
    }
  }
  
  .main-content {
    padding-top: 52px;
    
    &.with-nav {
      padding-top: 52px;
    }
  }
}

// 安全区域适配
@supports (padding: max(0px)) {
  .global-nav {
    padding-left: max(@spacing-md, env(safe-area-inset-left));
    padding-right: max(@spacing-md, env(safe-area-inset-right));
    height: calc(56px + env(safe-area-inset-top));
    padding-top: env(safe-area-inset-top);
  }
  
  .main-content.with-nav {
    padding-top: calc(56px + env(safe-area-inset-top));
  }
}
</style>