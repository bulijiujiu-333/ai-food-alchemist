<template>
  <div id="app">
    <!-- 全局背景装饰 -->
    <BackgroundDecorations />
    
    <!-- 路由视图 -->
    <router-view v-slot="{ Component, route }">
      <transition
        :name="String(route.meta.transition) || 'fade'"
        mode="out-in"
      >
        <component :is="Component" />
      </transition>
    </router-view>
    
    <!-- 全局加载动画 -->
    <div v-if="globalLoading" class="global-loading">
      <div class="loading-content">
        <div class="loading-animation">
          <div class="cooking-pot">
            <div class="pot-body"></div>
            <div class="pot-lid"></div>
            <div class="steam steam-1"></div>
            <div class="steam steam-2"></div>
            <div class="steam steam-3"></div>
          </div>
          <div class="loading-text">魔法烹饪中...</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import BackgroundDecorations from '@/components/BackgroundDecorations.vue'

// 全局加载状态
const globalLoading = ref(false)

// 模拟全局加载（开发用）
// 在实际项目中，这里可以用于API加载等
const simulateLoading = () => {
  globalLoading.value = true
  setTimeout(() => {
    globalLoading.value = false
  }, 1500)
}

// 开发时测试用
if (import.meta.env.DEV) {
  // simulateLoading()
}
</script>

<style lang="less">
@import '@/assets/styles/main.less';

#app {
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}

// 页面过渡动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform 0.3s ease;
}

.slide-left-enter-from {
  transform: translateX(100%);
}

.slide-left-leave-to {
  transform: translateX(-100%);
}

// 全局加载动画
.global-loading {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  
  .loading-content {
    text-align: center;
    
    .loading-animation {
      .cooking-pot {
        position: relative;
        width: 80px;
        height: 80px;
        margin: 0 auto 20px;
        
        .pot-body {
          width: 80px;
          height: 60px;
          background: linear-gradient(135deg, #FF6B6B, #FF8E53);
          border-radius: 40px 40px 20px 20px;
          position: relative;
          
          &:before {
            content: '';
            position: absolute;
            top: -10px;
            left: 10px;
            right: 10px;
            height: 10px;
            background: #E05555;
            border-radius: 10px 10px 0 0;
          }
        }
        
        .pot-lid {
          position: absolute;
          top: -20px;
          left: 15px;
          right: 15px;
          height: 10px;
          background: #FFD166;
          border-radius: 10px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        }
        
        .steam {
          position: absolute;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 10px;
          animation: steamRise 2s infinite ease-in-out;
        }
        
        .steam-1 {
          width: 20px;
          height: 40px;
          top: -50px;
          left: 30px;
          animation-delay: 0s;
        }
        
        .steam-2 {
          width: 15px;
          height: 30px;
          top: -45px;
          left: 40px;
          animation-delay: 0.5s;
        }
        
        .steam-3 {
          width: 10px;
          height: 20px;
          top: -40px;
          left: 50px;
          animation-delay: 1s;
        }
      }
      
      .loading-text {
        font-size: 16px;
        color: #666;
        font-weight: 500;
        animation: pulse 2s infinite;
      }
    }
  }
}

// 动画定义
@keyframes steamRise {
  0% {
    transform: translateY(0) scale(1);
    opacity: 0;
  }
  50% {
    opacity: 0.8;
  }
  100% {
    transform: translateY(-30px) scale(0.5);
    opacity: 0;
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

// 安全区域适配
@supports (padding: max(0px)) {
  #app {
    padding-left: max(0px, env(safe-area-inset-left));
    padding-right: max(0px, env(safe-area-inset-right));
  }
}

// 基础样式（从原有style部分复制过来）
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
  background: #f9f9f9;
  color: #333;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #FF6B6B, #FF8E53);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #ff5252, #ff7b47);
}
</style>