<script setup>
import HairlineTile from '@/components/common/HairlineTile.vue'
import StatusDot from '@/components/common/StatusDot.vue'

/** AI 해석 결과: 법령 → 조회 조건. interpretation: useScreeningStore().interpretation */
defineProps({
  interpretation: { type: Object, required: true },
  jobLabels: { type: Array, required: true },
  courseTitle: { type: String, default: '' },
})

const STATUS_MAP = { NOT_COMPLETED: 'NOT_DONE', IN_PROGRESS: 'IN_PROGRESS', COMPLETED: 'DONE' }
</script>

<template>
  <HairlineTile accent="teal" class="interp">
    <div class="row">
      <div class="t-label">법령</div>
      <div>
        {{ interpretation.lawRef || '—' }}
        <span class="t-muted" style="font-size: 12px">· {{ interpretation.rationale }}</span>
      </div>
    </div>
    <div class="row">
      <div class="t-label">대상 직무</div>
      <div class="chips">
        <v-chip v-for="j in jobLabels" :key="j">{{ j }}</v-chip>
      </div>
    </div>
    <div class="row">
      <div class="t-label">과정</div>
      <div>{{ courseTitle || '—' }}</div>
    </div>
    <div class="row">
      <div class="t-label">이수 상태</div>
      <div><StatusDot :status="STATUS_MAP[interpretation.status] ?? 'NOT_DONE'" /></div>
    </div>
  </HairlineTile>
</template>

<style scoped>
.interp {
  padding: 4px 16px;
}
.row {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  align-items: center;
  min-height: 36px;
  border-bottom: 1px solid rgba(0, 154, 147, 0.18);
  font-size: 13px;
}
.row:last-child {
  border-bottom: 0;
}
.chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  padding: 6px 0;
}
</style>
