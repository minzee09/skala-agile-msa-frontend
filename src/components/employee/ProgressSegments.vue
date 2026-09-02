<script setup>
/** 과정 수만큼 분절된 진행바. courses: enrollments.myCourses (status 포함) */
defineProps({
  courses: { type: Array, required: true },
  doneMinutes: { type: Number, required: true },
})
const COLOR = { DONE: 'var(--sk-teal)', IN_PROGRESS: 'var(--sk-orange)', NOT_DONE: 'var(--line)' }
const fmtMin = (m) => `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`
</script>

<template>
  <div>
    <div class="segments anim-grow" style="animation-delay: 0.15s">
      <span
        v-for="c in courses"
        :key="c.id"
        :style="{
          background: c.status === 'NOT_DONE' && c.urgent ? 'var(--sk-red)' : COLOR[c.status],
        }"
        :title="c.title"
      />
    </div>
    <div class="meta">
      <span
        ><b class="num"
          >{{ courses.filter((c) => c.status === 'DONE').length }} / {{ courses.length }}</b
        >
        과정 이수 ·
        <b class="num"
          >{{
            Math.round(
              (courses.filter((c) => c.status === 'DONE').length / (courses.length || 1)) * 100,
            )
          }}%</b
        ></span
      >
      <span
        >누적 이수시간 <b class="num">{{ fmtMin(doneMinutes) }}</b></span
      >
    </div>
  </div>
</template>

<style scoped>
.segments {
  display: flex;
  gap: 4px;
  height: 6px;
}
.segments span {
  flex: 1 1 0;
}
.meta {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  font-size: 12px;
  color: var(--ink-600);
}
.meta b {
  font-weight: 500;
  color: var(--ink-900);
}
</style>
