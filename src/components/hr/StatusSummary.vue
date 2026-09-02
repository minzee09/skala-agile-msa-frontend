<script setup>
import SegmentBar from '@/components/common/SegmentBar.vue'
import HairlineTile from '@/components/common/HairlineTile.vue'

/** summary: useHrStore().summary */
const props = defineProps({ summary: { type: Object, required: true } })

const pct = (n) => ((n / props.summary.headcount) * 100).toFixed(1)
const rows = () => [
  { label: '전 과정 이수', value: props.summary.completedAll, color: 'var(--sk-teal)' },
  { label: '일부 진행 중', value: props.summary.partial, color: 'var(--sk-orange)' },
  { label: '미착수', value: props.summary.notStarted, color: 'var(--sk-red)', red: true },
]
</script>

<template>
  <HairlineTile accent="teal" class="summary">
    <h2 class="t-h2" style="margin: 0">임직원 이수 상태</h2>
    <SegmentBar
      :segments="rows().map((r) => ({ value: Number(pct(r.value)), color: r.color }))"
      :height="8"
      style="margin-top: 22px"
    />
    <ul class="legend">
      <li v-for="r in rows()" :key="r.label">
        <span><i :style="{ background: r.color }" />{{ r.label }}</span>
        <span class="num"
          ><b :class="{ 't-red': r.red }">{{ r.value.toLocaleString() }}</b
          ><small>{{ pct(r.value) }}%</small></span
        >
      </li>
    </ul>
    <div class="summary__foot">
      <slot name="footer" />
    </div>
  </HairlineTile>
</template>

<style scoped>
.summary {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  height: 100%;
}
.legend {
  list-style: none;
  margin: 18px 0 0;
  padding: 0;
}
.legend li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 32px;
  border-bottom: 1px solid rgba(0, 154, 147, 0.18);
  font-size: 13px;
}
.legend li:last-child {
  border-bottom: 0;
}
.legend li > span:first-child {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.legend i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.legend b {
  font-weight: 500;
}
.legend small {
  color: var(--ink-400);
  margin-left: 8px;
  font-size: 13px;
}
.summary__foot {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 154, 147, 0.18);
  font-size: 13px;
  color: var(--ink-600);
  line-height: 1.55;
}
</style>
