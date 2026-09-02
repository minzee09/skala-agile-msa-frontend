<script setup>
import SegmentBar from '@/components/common/SegmentBar.vue'
import { useDday } from '@/composables/useDday'
import { fmtMonthDay } from '@/utils/date'
import { computed, toRef } from 'vue'

/** rows: useHrStore().courseRows */
const props = defineProps({ rows: { type: Array, required: true } })

const LEGEND = [
  { label: '이수', color: 'var(--sk-teal)' },
  { label: '진행 중', color: 'var(--sk-orange)' },
  { label: '미이수', color: 'var(--sk-red)' },
]

const withDday = computed(() =>
  props.rows.map((r) => {
    const { days, urgent } = useDday(toRef(() => r.course?.deadline))
    return { ...r, days: days.value, urgent: urgent.value && r.notDone > 0 }
  }),
)
</script>

<template>
  <section class="list">
    <div class="list__head">
      <h2 class="t-h2">과정별 이수 현황</h2>
      <div class="legend">
        <span v-for="l in LEGEND" :key="l.label"
          ><i :style="{ background: l.color }" />{{ l.label }}</span
        >
      </div>
    </div>

    <div class="rows">
      <div
        v-for="(r, i) in withDday"
        :key="r.courseId"
        class="row"
        :class="{ 'row--urgent': r.urgent }"
      >
        <div class="row__top">
          <span class="row__name">
            {{ r.course?.title }}
            <span v-if="r.urgent" class="num row__dday">D-{{ r.days }}</span>
          </span>
          <span class="num row__pct" :class="{ 't-red': r.urgent }">{{ r.done }}%</span>
        </div>
        <SegmentBar
          :segments="[
            { value: r.done, color: 'var(--sk-teal)' },
            { value: r.inProgress, color: 'var(--sk-orange)' },
            { value: r.notDone, color: 'var(--sk-red)' },
          ]"
          :delay="0.5 + i * 0.05"
        />
        <div class="t-small row__meta">
          <span class="num">{{ r.targets.toLocaleString() }}</span
          >명 · 마감 {{ r.course?.deadline ? fmtMonthDay(r.course.deadline) : '-' }}
          <template v-if="r.urgent">
            · 미이수 <span class="num">{{ r.notDoneCount }}</span
            >명</template
          >
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.list__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}
.t-h2 {
  margin: 0;
}
.legend {
  display: flex;
  gap: 16px;
  font-size: 11px;
  color: var(--ink-600);
}
.legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.legend i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.rows {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 18px;
}
.row {
  padding: 2px 12px;
  margin: -2px -12px;
  border-radius: var(--radius);
}
.row--urgent {
  background: var(--sk-red-tint);
}
.row__top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 6px;
}
.row__name {
  font-weight: 500;
}
.row--urgent .row__name {
  font-weight: 600;
}
.row__dday {
  font-size: 11px;
  font-weight: 600;
  color: var(--sk-red-text);
  margin-left: 8px;
}
.row__pct {
  font-weight: 500;
}
.row__meta {
  margin-top: 5px;
}
</style>
