<script setup>
import HairlineTile from '@/components/common/HairlineTile.vue'
import StatusDot from '@/components/common/StatusDot.vue'
import { fmtMonthDay } from '@/utils/date'

/** 임직원 과정 타일. course: myCourses 항목 (status, urgent, days 포함) */
defineProps({
  course: { type: Object, required: true },
  index: { type: Number, required: true },
})
defineEmits(['enroll', 'reset-demo'])
</script>

<template>
  <HairlineTile class="tile" :class="{ 'tile--urgent': course.status !== 'DONE' && course.urgent }">
    <div class="tile__top">
      <span class="mono t-small" :class="{ 't-red': course.status !== 'DONE' && course.urgent }">{{
        String(index + 1).padStart(2, '0')
      }}</span>
      <span
        v-if="course.status !== 'DONE'"
        class="num t-small"
        :class="{ 't-red': course.urgent }"
        style="font-weight: 600"
        >D-{{ course.days }}</span
      >
      <StatusDot v-else status="DONE" label="이수" />
    </div>
    <div class="tile__title" :class="{ done: course.status === 'DONE' }">{{ course.title }}</div>
    <div class="t-small" style="margin-top: 4px">
      <span class="num">{{ course.minutes }}</span
      >분 ·
      <span class="mono">{{
        fmtMonthDay(course.status === 'DONE' ? course.completedAt : course.deadline)
      }}</span>
    </div>
    <div class="tile__foot">
      <button
        v-if="course.canDemoReset"
        type="button"
        class="demo-reset"
        @click="$emit('reset-demo', course)"
      >
        시연 초기화
      </button>
      <template v-if="course.status === 'NOT_DONE'">
        <v-btn
          :color="course.urgent ? 'primary' : undefined"
          :variant="course.urgent ? 'flat' : 'outlined'"
          size="small"
          height="28"
          block
          @click="$emit('enroll', course)"
          >수강신청</v-btn
        >
      </template>
      <template v-else-if="course.status === 'IN_PROGRESS'"
        ><StatusDot status="IN_PROGRESS" label="신청 완료 · 확정 대기"
      /></template>
      <RouterLink
        v-else
        :to="{ name: 'me-certificates', query: { course: course.id } }"
        class="t-small"
        >이수증</RouterLink
      >
    </div>
  </HairlineTile>
</template>

<style scoped>
.tile {
  height: 150px;
  display: flex;
  flex-direction: column;
}
.tile--urgent {
  border-color: var(--sk-red);
}
.tile__top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.tile__title {
  margin-top: 8px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.01em;
  line-height: 1.4;
}
.tile__title.done {
  font-weight: 500;
  color: var(--ink-600);
}
.tile__foot {
  margin-top: auto;
}
.demo-reset {
  float: right;
  padding: 0;
  border: 0;
  border-bottom: 1px solid var(--line-strong);
  background: none;
  color: var(--ink-600);
  font: inherit;
  font-size: 11px;
  cursor: pointer;
}
.demo-reset:hover {
  color: var(--sk-red);
  border-bottom-color: var(--sk-red);
}
</style>
