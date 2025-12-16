<template>
  <div class="flavor-radar-container">
    <div ref="chartRef" class="flavor-radar-chart"></div>
    <div class="flavor-legend">
      <div v-for="(label, key) in flavorLabels" :key="key" class="legend-item">
        <span class="legend-color" :style="{ background: flavorColors[key as keyof typeof flavorColors] }"></span>
        <span class="legend-text">{{ label }}: {{ getFlavorValue(key as keyof FlavorProfile) }}/5</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'
import type { FlavorProfile } from '@/types/recipe'

// 定义props
interface Props {
  data: FlavorProfile
  width?: string
  height?: string
  showLegend?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  width: '100%',
  height: '300px',
  showLegend: true
})

// 图表引用
const chartRef = ref<HTMLElement>()
let chart: echarts.ECharts | null = null

// 风味标签和颜色
const flavorLabels = {
  savory: '咸',
  sweet: '甜',
  sour: '酸',
  spicy: '辣',
  umami: '鲜',
  bitter: '苦'
}

const flavorColors = {
  savory: '#FF6B6B',
  sweet: '#4ECDC4',
  sour: '#45B7D1',
  spicy: '#96CEB4',
  umami: '#FFEAA7',
  bitter: '#DDA0DD'
}

// 获取风味值
const getFlavorValue = (key: keyof FlavorProfile): number => {
  return props.data[key] || 0
}

// 初始化图表
const initChart = () => {
  if (!chartRef.value) {
    console.warn('图表容器未找到')
    return
  }

  // 销毁旧图表
  if (chart) {
    chart.dispose()
  }

  // 初始化新图表
  chart = echarts.init(chartRef.value)

  // 准备雷达图指标
  const indicator = Object.entries(flavorLabels).map(([key, label]) => ({
    name: label,
    max: 5,
    color: flavorColors[key as keyof typeof flavorColors]
  }))

  // 准备数据
  const data = Object.entries(props.data).map(([key, value]) => value)

  // 图表配置
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const index = params.dataIndex
        const keys = Object.keys(flavorLabels)
        const key = keys[index]
        const value = params.value
        const label = flavorLabels[key as keyof typeof flavorLabels]
        const color = flavorColors[key as keyof typeof flavorColors]

        return `
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 12px; height: 12px; border-radius: 50%; background: ${color};"></div>
            <span style="font-weight: bold;">${label}: ${value}/5</span>
          </div>
          <div style="margin-top: 4px; font-size: 12px; color: #666;">
            ${getFlavorDescription(key as keyof FlavorProfile, value)}
          </div>
        `
      },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#ddd',
      borderWidth: 1,
      textStyle: {
        color: '#333',
        fontSize: 12
      },
      extraCssText: 'box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); border-radius: 8px;'
    },
    radar: {
      shape: 'circle',
      center: ['50%', '50%'],
      radius: '60%',
      splitNumber: 5,
      axisName: {
        color: '#666',
        fontSize: 12,
        fontWeight: 'normal',
        formatter: (name: string, indicator: any) => {
          return `{${name}|${name}}`
        },
        rich: {
          savory: { color: flavorColors.savory, fontWeight: 'bold' },
          sweet: { color: flavorColors.sweet, fontWeight: 'bold' },
          sour: { color: flavorColors.sour, fontWeight: 'bold' },
          spicy: { color: flavorColors.spicy, fontWeight: 'bold' },
          umami: { color: flavorColors.umami, fontWeight: 'bold' },
          bitter: { color: flavorColors.bitter, fontWeight: 'bold' }
        }
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(0, 0, 0, 0.1)',
          width: 1
        }
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(0, 0, 0, 0.1)',
          width: 1
        }
      },
      splitArea: {
        areaStyle: {
          color: ['rgba(255,255,255,0.5)', 'rgba(255,255,255,0.2)']
        }
      },
      indicator: indicator
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: data,
            name: '风味分布',
            symbol: 'circle',
            symbolSize: 8,
            lineStyle: {
              width: 3,
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#FF6B6B' },
                { offset: 0.5, color: '#FF8E53' },
                { offset: 1, color: '#4ECDC4' }
              ])
            },
            areaStyle: {
              color: new echarts.graphic.RadialGradient(0.5, 0.5, 1, [
                { offset: 0, color: 'rgba(255, 107, 107, 0.3)' },
                { offset: 0.7, color: 'rgba(255, 142, 83, 0.2)' },
                { offset: 1, color: 'rgba(78, 205, 196, 0.1)' }
              ])
            },
            itemStyle: {
              color: '#FF6B6B',
              borderColor: '#fff',
              borderWidth: 2
            }
          }
        ]
      }
    ]
  }

  // 设置选项
  chart.setOption(option)

  // 响应式调整
  const resizeChart = () => {
    chart?.resize()
  }

  window.addEventListener('resize', resizeChart)

  // 清理函数
  onUnmounted(() => {
    window.removeEventListener('resize', resizeChart)
    chart?.dispose()
  })
}

// 获取风味描述
const getFlavorDescription = (key: keyof FlavorProfile, value: number): string => {
  const descriptions: Record<keyof FlavorProfile, string[]> = {
    savory: ['清淡', '适中', '偏咸', '较咸', '非常咸', '重咸'],
    sweet: ['不甜', '微甜', '适中', '偏甜', '较甜', '非常甜'],
    sour: ['不酸', '微酸', '适中', '偏酸', '较酸', '非常酸'],
    spicy: ['不辣', '微辣', '适中', '偏辣', '较辣', '非常辣'],
    umami: ['平淡', '微鲜', '适中', '鲜美', '很鲜', '极致鲜美'],
    bitter: ['不苦', '微苦', '适中', '偏苦', '较苦', '非常苦']
  }

  const index = Math.min(Math.floor(value), 5)
  return descriptions[key][index]
}

// 监听数据变化
watch(() => props.data, () => {
  if (chart) {
    const data = Object.entries(props.data).map(([key, value]) => value)
    chart.setOption({
      series: [{
        data: [{
          value: data
        }]
      }]
    })
  }
}, { deep: true })

// 组件挂载时初始化
onMounted(() => {
  setTimeout(() => {
    initChart()
  }, 100)
})
</script>

<style scoped lang="less">
.flavor-radar-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.flavor-radar-chart {
  width: v-bind(width);
  height: v-bind(height);
  min-height: 250px;
}

.flavor-legend {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 20px;
  width: 100%;
  max-width: 400px;

  .legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #666;

    .legend-color {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .legend-text {
      font-weight: 500;
    }
  }
}

@media (max-width: 768px) {
  .flavor-legend {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;

    .legend-item {
      font-size: 12px;
    }
  }
}
</style>