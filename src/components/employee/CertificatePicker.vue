<script setup>
import { motion } from 'motion-v'
import { fmtDate } from '@/utils/date'

/** 발급 가능한 이수증 선택 스트립. courses: 이수 완료 과정 목록 */
defineProps({
  courses: { type: Array, required: true },
  modelValue: { type: Number, default: null },
})
defineEmits(['update:modelValue'])
</script>

<template>
  <div class="picker">
    <button
      v-for="(c, i) in courses"
      :key="c.id"
      type="button"
      class="pick"
      :class="{ 'pick--active': modelValue === c.id }"
      @click="$emit('update:modelValue', c.id)"
    >
      <motion.span
        v-if="modelValue === c.id"
        layout-id="cert-pick"
        class="pick__rail"
        :transition="{ type: 'spring', stiffness: 320, damping: 32 }"
      />
      <span class="mono t-small">{{ String(i + 1).padStart(2, '0') }}</span>
      <span class="pick__title">{{ c.title }}</span>
      <span class="mono t-small">{{ fmtDate(c.completedAt) }} 이수</span>
    </button>
  </div>
</template>

<style scoped>
.picker {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
  border-top: 1px solid var(--line-strong);
  border-bottom: 1px solid var(--line);
}
.pick {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 14px 20px 14px 0;
  background: none;
  border: 0;
  font: inherit;
  text-align: left;
  cursor: pointer;
  color: var(--ink-600);
}
.pick__rail {
  position: absolute;
  top: -1px;
  left: 0;
  right: 20px;
  height: 2px;
  background: var(--sk-red);
}
.pick__title {
  font-size: 14px;
  letter-spacing: -0.01em;
  line-height: 1.35;
}
.pick--active {
  color: var(--ink-900);
}
.pick--active .pick__title {
  font-weight: 600;
}
</style>
