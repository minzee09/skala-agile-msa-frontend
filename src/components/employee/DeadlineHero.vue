<script setup>
import HairlineTile from '@/components/common/HairlineTile.vue'
import { fmtMonthDay } from '@/utils/date'

/** 가장 임박한 미이수 과정 — 화면당 색면(Red) 한 곳 */
defineProps({
  course: { type: Object, required: true },
  days: { type: Number, required: true },
})
defineEmits(['enroll', 'detail'])
</script>

<template>
  <HairlineTile accent="red" class="hero">
    <div>
      <div class="t-small" style="color: var(--ink-600)">
        가장 임박한 마감 — {{ course.title }} <span class="t-small">· 미신청</span>
      </div>
      <div class="hero__line">
        <span class="num hero__days">{{ days }}</span>
        <span class="hero__unit">일 남았습니다</span>
        <span class="t-small" style="margin-left: 4px"
          >마감 <span class="mono">{{ fmtMonthDay(course.deadline) }}</span> ·
          <span class="num">{{ course.minutes }}</span
          >분</span
        >
      </div>
    </div>
    <div class="hero__actions">
      <v-btn variant="outlined" height="40" @click="$emit('detail')">과정 안내</v-btn>
      <v-btn color="primary" height="40" @click="$emit('enroll')">지금 수강신청</v-btn>
    </div>
  </HairlineTile>
</template>

<style scoped>
.hero {
  border-color: transparent;
  padding: 16px 20px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}
.hero__line {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-top: 10px;
}
.hero__days {
  font-size: 56px;
  font-weight: 500;
  letter-spacing: -0.04em;
  line-height: 1;
  color: var(--sk-red);
}
.hero__unit {
  font-size: 22px;
  font-weight: 500;
  letter-spacing: -0.02em;
}
.hero__actions {
  display: flex;
  gap: 8px;
}
</style>
