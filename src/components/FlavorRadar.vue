<template>
  <div class="flavor-radar-container">
    <div class="radar-title">风味分析</div>
    
    <div class="radar-main-area">
      <!-- 直接使用一个容器，简化定位 -->
      <div class="radar-wrapper" ref="radarRef">
        <!-- 网格层 -->
        <div class="radar-grid">
          <div class="grid-circle" v-for="n in 5" :key="n" 
               :class="`circle-${n}`"></div>
        </div>
        
        <!-- 坐标轴层（延长至最外层圈） -->
        <div class="radar-axes">
          <div class="axis" v-for="(flavor, index) in flavors" :key="flavor.key"
               :style="{ transform: `rotate(${index * 60}deg)` }">
            <div class="axis-line"></div>
          </div>
        </div>
        
        <!-- 数据层 -->
        <div class="radar-data">
          <div class="data-polygon" :style="polygonStyle"></div>
          <div class="data-points">
            <div class="data-point" v-for="(point, index) in dataPoints" 
                 :key="index" :style="getPointStyle(point)"></div>
          </div>
        </div>
        
        <!-- 风味标签层（确保在圈外） -->
        <div class="flavor-labels">
          <div 
            class="flavor-label" 
            v-for="(flavor, index) in flavors" 
            :key="flavor.key"
            :style="getLabelStyle(index) as any"
          >
            {{ flavor.label }}
          </div>
        </div>
        
        <!-- 中心点 -->
        <div class="center-dot"></div>
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

// 风味定义 - 使用具体类型
interface FlavorItem {
  key: keyof FlavorProfile
  label: string
  color: string
}

const flavors: FlavorItem[] = [
  { key: 'savory', label: '咸', color: '#FF6B6B' },
  { key: 'sweet', label: '甜', color: '#4ECDC4' },
  { key: 'sour', label: '酸', color: '#FFD166' },
  { key: 'spicy', label: '辣', color: '#FF8E53' },
  { key: 'umami', label: '鲜', color: '#9D4EDD' },
  { key: 'bitter', label: '苦', color: '#2A9D8F' }
]

// 计算数据点
const dataPoints = computed(() => {
  return flavors.map((flavor, index) => {
    const value = props.data[flavor.key] || 0
    const normalizedValue = Math.min(Math.max(value, 0), 5)
    
    // 确保每个值对应正确的格数（每格8%，5格共40%）
    const radiusPercent = (normalizedValue / 5) * 40
    
    const angle = (index * 60 + 30) % 360
    
    return {
      ...flavor,
      value: normalizedValue,
      angle: angle * Math.PI / 180,
      radiusPercent,
      angleDeg: angle
    }
  })
})

// 计算多边形样式
const polygonStyle = computed(() => {
  const points = dataPoints.value.map(point => {
    const x = 50 + point.radiusPercent * Math.cos(point.angle)
    const y = 50 + point.radiusPercent * Math.sin(point.angle)
    return `${x}% ${y}%`
  }).join(', ')
  
  return {
    clipPath: `polygon(${points})`,
    background: `conic-gradient(
      from 0deg at 50% 50%,
      ${flavors.map((f, i) => `${f.color} ${i * 60}deg ${(i + 1) * 60}deg`).join(', ')}
    )`
  }
})

// 获取点样式
const getPointStyle = (point: any) => {
  const x = 50 + point.radiusPercent * Math.cos(point.angle)
  const y = 50 + point.radiusPercent * Math.sin(point.angle)
  
  return {
    left: `${x}%`,
    top: `${y}%`,
    backgroundColor: point.color,
    transform: 'translate(-50%, -50%)',
    boxShadow: `0 0 10px ${point.color}`
  }
}

// 获取标签样式（确保在圈外）
const getLabelStyle = (index: number) => {
  const flavor = flavors[index]!
  
  const angleDeg = (index * 60 + 30) % 360
  const angleRad = angleDeg * Math.PI / 180
  
  
  const radiusPercent = 42  
  
  const x = 50 + radiusPercent * Math.cos(angleRad)
  const y = 50 + radiusPercent * Math.sin(angleRad)
  
  let transform = ''
  let textAlign = 'center'
  
  // 根据角度调整标签位置，确保都在圈外
 if (angleDeg >= 15 && angleDeg <= 45) {
  transform = 'translate(2px, -50%)' 
} else if (angleDeg > 45 && angleDeg < 135) {
  transform = 'translate(-50%, 2px)'  
  textAlign = 'center'
} else if (angleDeg >= 135 && angleDeg <= 165) {
  transform = 'translate(-100%, -50%)'
  textAlign = 'right'
} else if (angleDeg > 165 && angleDeg < 225) {
  transform = 'translate(-100%, -50%)'
  textAlign = 'right'
} else if (angleDeg >= 225 && angleDeg <= 255) {
  transform = 'translate(-100%, -50%)'
  textAlign = 'right'
} else if (angleDeg > 255 && angleDeg < 315) {
  transform = 'translate(-50%, -100%)'
  textAlign = 'center'
} else {
  transform = 'translate(0, -50%)'
  textAlign = 'left'
}
  
  return {
    left: `${x}%`,
    top: `${y}%`,
    transform,
    color: flavor.color,
    fontSize: '14px',
    fontWeight: '600',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
    background: 'rgba(255, 255, 255, 0.95)',
    padding: '4px 8px',
    borderRadius: '12px',
    border: `1px solid ${flavor.color}40`,
    minWidth: '28px',
    textAlign,
    zIndex: 10
  } as any
}

const getFlavorValue = (key: string): number => {
  return props.data[key as keyof FlavorProfile] || 0
}

// 响应式调整
const handleResize = () => {
  if (!radarRef.value) return
  
  const container = radarRef.value.parentElement?.parentElement
  if (!container) return
  
  const availableWidth = container.clientWidth
  const size = Math.min(availableWidth, 300)
  
  const outerContainer = radarRef.value.parentElement
  if (outerContainer) {
    outerContainer.style.width = `${size}px`
    outerContainer.style.height = `${size}px`
  }
  
  radarRef.value.style.width = `${size}px`
  radarRef.value.style.height = `${size}px`
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
  justify-content: center;
  gap: 20px;
  padding: 20px 0;
  min-height: 100%;
  
  .radar-title {
    font-size: 18px;
    font-weight: 600;
    color: @text-primary;
    text-align: center;
    margin-bottom: 20px;
    width: 100%;
  }
  
  .radar-main-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
  }
  
  // 主容器
  .radar-wrapper {
    position: relative;
    width: 300px;
    height: 300px;
    margin: 0 auto;
    
    > * {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
    
    // 网格 - 同心圆
    .radar-grid {
      .grid-circle {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 50%;
        
        &.circle-1 { width: 40px; height: 40px; border-color: rgba(0, 0, 0, 0.05); }
        &.circle-2 { width: 80px; height: 80px; border-color: rgba(0, 0, 0, 0.08); }
        &.circle-3 { width: 120px; height: 120px; border-color: rgba(0, 0, 0, 0.1); }
        &.circle-4 { width: 160px; height: 160px; border-color: rgba(0, 0, 0, 0.12); }
        &.circle-5 { width: 200px; height: 200px; border-color: rgba(0, 0, 0, 0.15); }
      }
    }
    
    // 坐标轴（延长至最外层圈）
    .radar-axes {
      width: 200px;
      height: 200px;
      
      .axis {
        position: absolute;
        top: 0;
        left: 50%;
        width: 1px;
        height: 100px;
        transform-origin: bottom center;
        background: linear-gradient(to top, rgba(0, 0, 0, 0.2), transparent);
        
        .axis-line {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.1);
        }
      }
    }
    
    // 数据区域
    .radar-data {
      width: 200px;
      height: 200px;
      
      .data-polygon {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        opacity: 0.3;
        border-radius: 50%;
        transition: clip-path 0.8s ease;
      }
      
      .data-points {
        .data-point {
          position: absolute;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid white;
          z-index: 2;
        }
      }
    }
    
    // 风味标签层（确保在圈外）
    .flavor-labels {
      width: 100%;
      height: 100%;
      pointer-events: none;
      
      .flavor-label {
        position: absolute;
        z-index: 10;
        white-space: nowrap;
        transition: all 0.3s ease;
        
        &:hover {
          transform: scale(1.1) !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
          z-index: 11;
        }
      }
    }
    
    // 中心点
    .center-dot {
      width: 8px;
      height: 8px;
      background: #666;
      border-radius: 50%;
      z-index: 3;
    }
  }
  
  // 图例
  .radar-legend {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    width: 100%;
    max-width: 300px;
    margin-top: 20px;
    
    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      padding: 4px 8px;
      background: @background-light;
      border-radius: 8px;
      
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

// 响应式设计
@media (max-width: @breakpoint-tablet) {
  .flavor-radar-container {
    .radar-wrapper {
      width: 260px !important;
      height: 260px !important;
      
      .radar-grid .grid-circle {
        &.circle-1 { width: 35px; height: 35px; }
        &.circle-2 { width: 70px; height: 70px; }
        &.circle-3 { width: 105px; height: 105px; }
        &.circle-4 { width: 140px; height: 140px; }
        &.circle-5 { width: 175px; height: 175px; }
      }
      
      .radar-axes {
        width: 175px !important;
        height: 175px !important;
        
        .axis {
          height: 87.5px !important;
        }
      }
      
      .radar-data {
        width: 175px !important;
        height: 175px !important;
      }
      
      .flavor-labels .flavor-label {
        font-size: 12px !important;
        padding: 1px 4px !important;
      }
    }
    
    .radar-legend {
      grid-template-columns: repeat(2, 1fr);
      max-width: 260px;
    }
  }
}

@media (max-width: 480px) {
  .flavor-radar-container {
    .radar-wrapper {
      width: 220px !important;
      height: 220px !important;
      
      .radar-grid .grid-circle {
        &.circle-1 { width: 30px; height: 30px; }
        &.circle-2 { width: 60px; height: 60px; }
        &.circle-3 { width: 90px; height: 90px; }
        &.circle-4 { width: 120px; height: 120px; }
        &.circle-5 { width: 150px; height: 150px; }
      }
      
      .radar-axes {
        width: 150px !important;
        height: 150px !important;
        
        .axis {
          height: 75px !important;
        }
      }
      
      .radar-data {
        width: 150px !important;
        height: 150px !important;
      }
      
      .flavor-labels .flavor-label {
        font-size: 11px !important;
        padding: 1px 3px !important;
        min-width: 20px !important;
      }
    }
    
    .radar-legend {
      grid-template-columns: 1fr;
      max-width: 220px;
    }
  }
}
</style>