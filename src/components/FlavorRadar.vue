<template>
  <div class="flavor-radar-container">
    <div class="radar-title">风味分析</div>
    
    <!-- 雷达图主体 -->
    <div class="radar-main" ref="radarRef">
      <!-- 背景网格 -->
      <div class="radar-grid">
        <div class="grid-circle" v-for="n in 5" :key="n" 
             :style="{ transform: `scale(${n * 0.2})` }"></div>
      </div>
      
      <!-- 坐标轴 -->
      <div class="radar-axes">
        <div class="axis" v-for="(flavor, index) in flavors" :key="flavor.key"
             :style="{ transform: `rotate(${index * 60}deg)` }">
          <span class="axis-label">{{ flavor.label }}</span>
        </div>
      </div>
      
      <!-- 数据区域 -->
      <div class="radar-data">
        <!-- 多边形填充 -->
        <div class="data-polygon" :style="polygonStyle"></div>
        
        <!-- 数据点 -->
        <div class="data-points">
          <div class="data-point" v-for="(point, index) in dataPoints" 
               :key="index" :style="getPointStyle(point)"></div>
        </div>
      </div>
    </div>
    
    <!-- 图例 -->
    <div class="radar-legend">
      <div class="legend-item" v-for="flavor in flavors" :key="flavor.key">
        <div class="legend-color" :style="{ backgroundColor: flavor.color }"></div>
        <span class="legend-label">{{ flavor.label }}</span>
        <span class="legend-value">{{ getFlavorValue(flavor.key) }}/5</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { FlavorProfile } from '@/types/recipe'

interface Props {
  data: FlavorProfile
  width?: number
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  width: 300,
  height: 300
})

const radarRef = ref<HTMLElement>()

// 风味定义
const flavors = [
  { key: 'savory', label: '咸', color: '#FF6B6B' },
  { key: 'sweet', label: '甜', color: '#4ECDC4' },
  { key: 'sour', label: '酸', color: '#FFD166' },
  { key: 'spicy', label: '辣', color: '#FF8E53' },
  { key: 'umami', label: '鲜', color: '#9D4EDD' },
  { key: 'bitter', label: '苦', color: '#2A9D8F' }
]

// 计算数据点
const dataPoints = computed(() => {
  return flavors.map(flavor => {
    const value = props.data[flavor.key as keyof FlavorProfile] || 0
    const normalizedValue = Math.min(Math.max(value, 0), 5)
    const angle = (flavors.findIndex(f => f.key === flavor.key) * 60) * Math.PI / 180
    
    return {
      ...flavor,
      value: normalizedValue,
      angle,
      radius: (normalizedValue / 5) * 100
    }
  })
})

// 计算多边形样式
const polygonStyle = computed(() => {
  const points = dataPoints.value.map(point => {
    const x = 50 + point.radius * Math.cos(point.angle)
    const y = 50 + point.radius * Math.sin(point.angle)
    return `${x}% ${y}%`
  }).join(', ')
  
  return {
    clipPath: `polygon(${points})`,
    background: `conic-gradient(
      from 0deg,
      ${flavors.map((f, i) => `${f.color} ${i * 60}deg ${(i + 1) * 60}deg`).join(', ')}
    )`
  }
})

// 获取点样式
const getPointStyle = (point: any) => {
  const x = 50 + point.radius * Math.cos(point.angle)
  const y = 50 + point.radius * Math.sin(point.angle)
  
  return {
    left: `${x}%`,
    top: `${y}%`,
    backgroundColor: point.color,
    boxShadow: `0 0 10px ${point.color}`
  }
}

const getFlavorValue = (key: string): number => {
  return props.data[key as keyof FlavorProfile] || 0
}

// 响应式调整
const handleResize = () => {
  if (!radarRef.value) return
  
  const container = radarRef.value.parentElement
  if (!container) return
  
  const maxSize = Math.min(container.clientWidth, 400)
  radarRef.value.style.width = `${maxSize}px`
  radarRef.value.style.height = `${maxSize}px`
}

onMounted(() => {
  handleResize()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style lang="less" scoped>
@import '@/assets/styles/main.less';

.flavor-radar-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  
  .radar-title {
    font-size: 18px;
    font-weight: 600;
    color: @text-primary;
    text-align: center;
  }
  
  .radar-main {
    position: relative;
    width: 280px;
    height: 280px;
    margin: 0 auto;
    
    // 网格
    .radar-grid {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      
      .grid-circle {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 50%;
        
        &:nth-child(1) { border-color: rgba(0, 0, 0, 0.05); }
        &:nth-child(2) { border-color: rgba(0, 0, 0, 0.08); }
        &:nth-child(3) { border-color: rgba(0, 0, 0, 0.1); }
        &:nth-child(4) { border-color: rgba(0, 0, 0, 0.12); }
        &:nth-child(5) { border-color: rgba(0, 0, 0, 0.15); }
      }
    }
    
    // 坐标轴
    .radar-axes {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      
      .axis {
        position: absolute;
        top: 0;
        left: 50%;
        width: 1px;
        height: 100%;
        transform-origin: bottom center;
        
        &::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 100%;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.1), transparent);
        }
        
        .axis-label {
          position: absolute;
          top: -30px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 12px;
          font-weight: 500;
          color: @text-secondary;
          white-space: nowrap;
        }
      }
    }
    
    // 数据区域
    .radar-data {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      
      .data-polygon {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        opacity: 0.3;
        transition: clip-path 0.8s ease;
      }
      
      .data-points {
        .data-point {
          position: absolute;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid white;
          transform: translate(-50%, -50%);
          transition: all 0.5s ease;
          z-index: 2;
        }
      }
    }
  }
  
  // 图例
  .radar-legend {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    width: 100%;
    max-width: 280px;
    
    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      
      .legend-color {
        width: 12px;
        height: 12px;
        border-radius: 2px;
      }
      
      .legend-label {
        color: @text-secondary;
        flex: 1;
      }
      
      .legend-value {
        color: @text-primary;
        font-weight: 600;
      }
    }
  }
}

// 响应式
@media (max-width: @breakpoint-tablet) {
  .flavor-radar-container {
    .radar-main {
      width: 240px !important;
      height: 240px !important;
    }
    
    .radar-legend {
      grid-template-columns: repeat(2, 1fr);
    }
  }
}

@media (max-width: 480px) {
  .flavor-radar-container {
    .radar-main {
      width: 200px !important;
      height: 200px !important;
    }
    
    .radar-legend {
      grid-template-columns: 1fr;
    }
  }
}
</style>