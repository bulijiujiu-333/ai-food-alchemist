<template>
  <div class="recipe-card" @click="$emit('click')" :class="{ 'has-story': recipe.story }">
    <!-- 装饰性元素 -->
    <div class="card-decoration">
      <div class="decoration-corner top-left"></div>
      <div class="decoration-corner top-right"></div>
      <div class="decoration-corner bottom-left"></div>
      <div class="decoration-corner bottom-right"></div>
    </div>

    <!-- 卡片内容 -->
    <div class="card-content">
      <!-- 标题区域 -->
      <div class="card-header">
        <h3 class="recipe-title">{{ recipe.displayName }}</h3>
        <div class="recipe-tags">
          <span v-if="recipe.difficulty" class="tag difficulty" :class="recipe.difficulty">
            {{ recipe.difficulty }}
          </span>
          <span v-if="recipe.cookingTime" class="tag cooking-time">
            ⏱️ {{ recipe.cookingTime }}分钟
          </span>
          <span v-if="recipe.category?.length" class="tag category">
            {{ recipe.category[0] }}
          </span>
        </div>
      </div>

      <!-- 描述 -->
      <p class="recipe-description">{{ recipe.description }}</p>

      <!-- 原菜谱名称 -->
      <div class="original-name">
        <span class="label">原菜名：</span>
        <span class="name">{{ recipe.originalName }}</span>
      </div>

      <!-- 食材预览 -->
      <div class="ingredients-section">
        <div class="section-title">
          <span class="icon">🥗</span>
          <span>主要食材</span>
          <span class="count">({{ recipe.ingredients.length }}种)</span>
        </div>
        <div class="ingredients-tags">
          <span
            v-for="(ingredient, index) in displayedIngredients"
            :key="index"
            class="ingredient-tag"
            :style="{ '--tag-index': index }"
          >
            {{ ingredient }}
          </span>
          <span v-if="hasMoreIngredients" class="more-tag">
            +{{ recipe.ingredients.length - 3 }}种
          </span>
        </div>
      </div>

      <!-- AI生成的故事 -->
      <div v-if="recipe.story" class="recipe-story">
        <div class="story-header">
          <span class="icon">📖</span>
          <span class="title">风味故事</span>
          <span class="ai-badge">AI生成</span>
        </div>
        <p class="story-content">{{ recipe.story }}</p>
      </div>

      <!-- 风味雷达图预览 -->
      <div class="flavor-preview">
        <div class="section-title">
          <span class="icon">📊</span>
          <span>风味分析</span>
        </div>
        <div class="flavor-bars">
          <div
            v-for="(value, key) in recipe.flavorProfile"
            :key="key"
            class="flavor-bar"
          >
            <div class="flavor-info">
              <span class="flavor-name">{{ getFlavorLabel(key as keyof FlavorProfile) }}</span>
              <span class="flavor-value">{{ value }}/5</span>
            </div>
            <div class="bar-container">
              <div
                class="bar-fill"
                :style="{
                  width: `${(value / 5) * 100}%`,
                  background: getFlavorColor(key as keyof FlavorProfile)
                }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 查看详情按钮 -->
      <div class="card-footer">
        <button class="view-detail-btn">
          <span>查看详细步骤</span>
          <span class="icon">→</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Recipe, FlavorProfile } from '@/types/recipe'

// 定义props
interface Props {
  recipe: Recipe
}

const props = defineProps<Props>()
defineEmits<{
  click: []
}>()

// 风味标签映射
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

// 计算属性
const displayedIngredients = computed(() => {
  return props.recipe.ingredients.slice(0, 3)
})

const hasMoreIngredients = computed(() => {
  return props.recipe.ingredients.length > 3
})

// 方法
const getFlavorLabel = (key: keyof FlavorProfile): string => {
  return flavorLabels[key] || key
}

const getFlavorColor = (key: keyof FlavorProfile): string => {
  return flavorColors[key as keyof typeof flavorColors] || '#666'
}
</script>

<style scoped lang="less">
.recipe-card {
  position: relative;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 20px;
  padding: 25px;
  box-shadow:
    0 8px 30px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  overflow: hidden;
  border: 1px solid rgba(255, 107, 107, 0.1);

  &:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow:
      0 20px 50px rgba(255, 107, 107, 0.15),
      0 10px 20px rgba(0, 0, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.5);

    .card-decoration .decoration-corner {
      opacity: 1;
      transform: scale(1);
    }

    .view-detail-btn {
      transform: translateX(5px);
      background: linear-gradient(135deg, #FF6B6B, #FF8E53);
      box-shadow: 0 8px 25px rgba(255, 107, 107, 0.3);
    }
  }
}

.card-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;

  .decoration-corner {
    position: absolute;
    width: 40px;
    height: 40px;
    opacity: 0;
    transform: scale(0.5);
    transition: all 0.5s ease;

    &::before,
    &::after {
      content: '';
      position: absolute;
      background: linear-gradient(135deg, #FF6B6B, #FF8E53);
    }

    &::before {
      width: 15px;
      height: 2px;
    }

    &::after {
      width: 2px;
      height: 15px;
    }

    &.top-left {
      top: 15px;
      left: 15px;

      &::before { top: 0; left: 0; }
      &::after { top: 0; left: 0; }
    }

    &.top-right {
      top: 15px;
      right: 15px;

      &::before { top: 0; right: 0; }
      &::after { top: 0; right: 0; }
    }

    &.bottom-left {
      bottom: 15px;
      left: 15px;

      &::before { bottom: 0; left: 0; }
      &::after { bottom: 0; left: 0; }
    }

    &.bottom-right {
      bottom: 15px;
      right: 15px;

      &::before { bottom: 0; right: 0; }
      &::after { bottom: 0; right: 0; }
    }
  }
}

.card-content {
  position: relative;
  z-index: 1;
}

.card-header {
  margin-bottom: 20px;

  .recipe-title {
    font-size: 24px;
    font-weight: 700;
    color: #333;
    margin: 0 0 12px 0;
    line-height: 1.3;
    background: linear-gradient(135deg, #FF6B6B, #FF8E53);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .recipe-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    .tag {
      padding: 6px 12px;
      border-radius: 15px;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;

      &.difficulty {
        background: rgba(255, 107, 107, 0.1);
        color: #FF6B6B;
        border: 1px solid rgba(255, 107, 107, 0.2);

        &.简单 { background: rgba(76, 175, 80, 0.1); color: #4CAF50; border-color: rgba(76, 175, 80, 0.2); }
        &.中等 { background: rgba(255, 193, 7, 0.1); color: #FF9800; border-color: rgba(255, 193, 7, 0.2); }
        &.困难 { background: rgba(244, 67, 54, 0.1); color: #F44336; border-color: rgba(244, 67, 54, 0.2); }
      }

      &.cooking-time {
        background: rgba(33, 150, 243, 0.1);
        color: #2196F3;
        border: 1px solid rgba(33, 150, 243, 0.2);
      }

      &.category {
        background: rgba(156, 39, 176, 0.1);
        color: #9C27B0;
        border: 1px solid rgba(156, 39, 176, 0.2);
      }
    }
  }
}

.recipe-description {
  font-size: 15px;
  color: #666;
  line-height: 1.6;
  margin: 0 0 20px 0;
  padding-left: 10px;
  border-left: 3px solid rgba(255, 107, 107, 0.3);
  padding-left: 15px;
}

.original-name {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 25px;
  padding: 10px 15px;
  background: linear-gradient(135deg, rgba(255, 248, 225, 0.5), rgba(255, 243, 205, 0.3));
  border-radius: 12px;
  border: 1px solid rgba(255, 193, 7, 0.2);

  .label {
    font-size: 13px;
    color: #FF9800;
    font-weight: 500;
  }

  .name {
    font-size: 14px;
    color: #5D4037;
    font-style: italic;
  }
}

.ingredients-section {
  margin-bottom: 25px;

  .section-title {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 15px;

    .icon {
      font-size: 18px;
    }

    span:not(.icon) {
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }

    .count {
      font-size: 13px;
      color: #666;
      font-weight: normal;
    }
  }

  .ingredients-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;

    .ingredient-tag {
      padding: 8px 16px;
      background: linear-gradient(135deg, rgba(255, 107, 107, 0.1), rgba(255, 142, 83, 0.1));
      border: 1px solid rgba(255, 107, 107, 0.2);
      border-radius: 20px;
      font-size: 14px;
      color: #FF6B6B;
      font-weight: 500;
      transition: all 0.3s ease;
      animation: tagAppear 0.5s ease calc(var(--tag-index) * 0.1s) backwards;

      &:hover {
        transform: translateY(-2px);
        background: linear-gradient(135deg, rgba(255, 107, 107, 0.2), rgba(255, 142, 83, 0.2));
        box-shadow: 0 4px 12px rgba(255, 107, 107, 0.15);
      }
    }

    .more-tag {
      padding: 8px 16px;
      background: rgba(33, 150, 243, 0.1);
      border: 1px solid rgba(33, 150, 243, 0.2);
      border-radius: 20px;
      font-size: 14px;
      color: #2196F3;
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 60px;
    }
  }
}

@keyframes tagAppear {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.recipe-story {
  margin-bottom: 25px;
  padding: 20px;
  background: linear-gradient(135deg, rgba(255, 249, 196, 0.3), rgba(255, 253, 231, 0.2));
  border-radius: 15px;
  border: 1px solid rgba(255, 213, 79, 0.3);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #FFD54F, #FFB300);
  }

  .story-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;

    .icon {
      font-size: 18px;
    }

    .title {
      font-size: 16px;
      font-weight: 600;
      color: #5D4037;
    }

    .ai-badge {
      font-size: 11px;
      padding: 2px 8px;
      background: linear-gradient(135deg, #4ECDC4, #44A08D);
      color: white;
      border-radius: 10px;
      font-weight: 500;
      letter-spacing: 0.5px;
    }
  }

  .story-content {
    font-size: 14px;
    color: #5D4037;
    line-height: 1.7;
    margin: 0;
    font-style: italic;
  }
}

.flavor-preview {
  margin-bottom: 25px;

  .section-title {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 15px;

    .icon {
      font-size: 18px;
    }

    span:not(.icon) {
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }
  }

  .flavor-bars {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .flavor-bar {
      .flavor-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;

        .flavor-name {
          font-size: 13px;
          color: #666;
          font-weight: 500;
        }

        .flavor-value {
          font-size: 12px;
          color: #999;
          font-weight: 500;
        }
      }

      .bar-container {
        height: 8px;
        background: rgba(0, 0, 0, 0.05);
        border-radius: 4px;
        overflow: hidden;

        .bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      }
    }
  }
}

.card-footer {
  text-align: center;
  margin-top: 10px;

  .view-detail-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 14px 32px;
    background: linear-gradient(135deg, rgba(255, 107, 107, 0.9), rgba(255, 142, 83, 0.9));
    color: white;
    border: none;
    border-radius: 50px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 6px 20px rgba(255, 107, 107, 0.2);

    .icon {
      font-size: 16px;
      transition: transform 0.3s ease;
    }

    &:hover {
      transform: translateX(5px);
      box-shadow: 0 8px 25px rgba(255, 107, 107, 0.3);

      .icon {
        transform: translateX(3px);
      }
    }
  }
}

@media (max-width: 768px) {
  .recipe-card {
    padding: 20px;
    border-radius: 16px;
  }

  .recipe-title {
    font-size: 20px !important;
  }

  .ingredients-tags {
    gap: 8px !important;

    .ingredient-tag {
      padding: 6px 12px !important;
      font-size: 13px !important;
    }
  }

  .view-detail-btn {
    padding: 12px 24px !important;
    font-size: 14px !important;
  }
}
</style>