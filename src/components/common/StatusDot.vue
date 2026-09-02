<script setup>
import { computed } from 'vue'

/** 상태는 점 + 텍스트로만 표시한다(색만으로 구분하지 않음). 텍스트는 잉크색. */
const props = defineProps({
  status: { type: String, required: true }, // DONE | IN_PROGRESS | NOT_DONE
  label: { type: String, default: '' },
})

const META = {
  DONE: { color: 'var(--sk-teal)', label: '이수 완료', text: 'var(--ink-600)' },
  IN_PROGRESS: { color: 'var(--sk-orange)', label: '진행 중', text: 'var(--ink-600)' },
  NOT_DONE: { color: 'var(--sk-red)', label: '미이수', text: 'var(--sk-red-text)' },
}
const meta = computed(() => META[props.status] ?? META.NOT_DONE)
</script>

<template>
  <span class="status" :style="{ color: meta.text }">
    <span class="status__dot" :style="{ background: meta.color }" />
    {{ label || meta.label }}
  </span>
</template>

<style scoped>
.status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
}
.status__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
</style>
