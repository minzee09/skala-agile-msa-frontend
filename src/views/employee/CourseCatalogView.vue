<script setup>
import { computed, onMounted, ref } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import RevealGroup from '@/components/common/RevealGroup.vue'
import RevealItem from '@/components/common/RevealItem.vue'
import HairlineTile from '@/components/common/HairlineTile.vue'
import StatusDot from '@/components/common/StatusDot.vue'
import EnrollConfirmDialog from '@/components/employee/EnrollConfirmDialog.vue'
import { useCoursesStore } from '@/stores/courses'
import { useEnrollmentsStore } from '@/stores/enrollments'
import { today } from '@/composables/useDday'
import { daysUntil, fmtDday, fmtMonthDay } from '@/utils/date'

const courses = useCoursesStore()
const enrollments = useEnrollmentsStore()
const filter = ref('ALL')
const dialog = ref(false)
const selected = ref(null)
const ready = ref(false)

onMounted(async () => {
  if (!courses.items.length) await courses.fetchAll()
  if (!enrollments.mine.length) await enrollments.fetchMine()
  ready.value = true
})

const all = computed(() =>
  enrollments.myCourses.map((c) => {
    const days = c.deadline ? daysUntil(c.deadline, today()) : null
    return { ...c, days, urgent: days !== null && days <= 30 }
  }),
)
const list = computed(() =>
  all.value.filter((c) =>
    filter.value === 'ALL'
      ? true
      : filter.value === 'DONE'
        ? c.status === 'DONE'
        : c.status !== 'DONE',
  ),
)
const TABS = [
  { key: 'ALL', label: '전체', count: () => all.value.length },
  { key: 'NOT_DONE', label: '미이수', count: () => enrollments.notDoneCount, red: true },
  { key: 'DONE', label: '이수 완료', count: () => enrollments.doneCount },
]

function openEnroll(c) {
  selected.value = c
  dialog.value = true
}
</script>

<template>
  <PageHeader title="교육 과정">
    <template #subtitle
      >{{ today().getFullYear() }}년 법정의무교육 {{ all.length }}개 · 미이수
      {{ enrollments.notDoneCount }}</template
    >
  </PageHeader>

  <div class="tabs">
    <button
      v-for="t in TABS"
      :key="t.key"
      type="button"
      :class="{ active: filter === t.key }"
      @click="filter = t.key"
    >
      {{ t.label }} <span class="num" :class="{ 't-red': t.red }">{{ t.count() }}</span>
    </button>
    <span class="t-small" style="margin-left: auto; padding-bottom: 10px">마감 임박순</span>
  </div>

  <div class="grid">
    <RevealGroup :ready="ready" :stagger="0.07" :delay="0.08">
      <RevealItem v-for="(c, i) in list" :key="c.id" :rise="12">
        <HairlineTile class="card" :accent="c.status === 'NOT_DONE' && c.urgent ? 'red' : null">
          <div class="card__top">
            <span class="mono t-small" :class="{ 't-red': c.status === 'NOT_DONE' && c.urgent }">{{
              String(i + 1).padStart(2, '0')
            }}</span>
            <span
              class="mono t-small"
              :class="{ 't-red': c.status === 'NOT_DONE' && c.urgent }"
              style="font-weight: 500"
            >
              <template v-if="c.status === 'DONE'">{{ fmtMonthDay(c.completedAt) }} 이수</template>
              <template v-else
                >{{ fmtMonthDay(c.deadline) }} · {{ fmtDday(c.deadline, today()) }}</template
              >
            </span>
          </div>
          <div class="card__title" :class="{ done: c.status === 'DONE' }">{{ c.title }}</div>
          <div class="t-small" style="margin-top: 6px; color: var(--ink-600)">
            {{ c.law }} · <span class="num">{{ c.minutes }}</span
            >분
          </div>
          <div class="t-small" style="margin-top: 4px">
            {{ c.required ? '필수' : '권장' }} · {{ c.targetRule }}
          </div>
          <div class="card__foot">
            <StatusDot :status="c.status" />
            <v-btn
              v-if="c.status === 'NOT_DONE'"
              :color="c.urgent ? 'primary' : undefined"
              :variant="c.urgent ? 'flat' : 'outlined'"
              @click="openEnroll(c)"
              >수강신청</v-btn
            >
            <button
              v-else-if="enrollments.canDemoReset(c.id)"
              type="button"
              class="demo-reset"
              @click="enrollments.resetDemoEnrollment(c.id)"
            >
              시연 초기화
            </button>
            <RouterLink
              v-else-if="c.status === 'DONE'"
              :to="{ name: 'me-certificates', query: { course: c.id } }"
              class="t-small"
              >이수증</RouterLink
            >
            <StatusDot v-else status="IN_PROGRESS" label="신청 완료 · 확정 대기" />
          </div>
        </HairlineTile>
      </RevealItem>
    </RevealGroup>
  </div>

  <p class="t-small foot">
    모든 법정의무교육은 회사 부담 — 수강신청 시 <span class="num">0</span>원으로 즉시 확정
  </p>

  <EnrollConfirmDialog
    v-model="dialog"
    :course="selected"
    :dday="selected?.deadline ? fmtDday(selected.deadline, today()) : ''"
    :on-confirm="(c) => enrollments.enroll(c.id)"
  />
</template>

<style scoped>
.tabs {
  display: flex;
  gap: 28px;
  border-bottom: 1px solid var(--line);
  font-size: 14px;
}
.tabs button {
  background: none;
  border: 0;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  padding: 0 0 10px;
  font: inherit;
  color: var(--ink-600);
  cursor: pointer;
}
.tabs button.active {
  color: var(--ink-900);
  font-weight: 600;
  border-bottom-color: var(--ink-900);
}
.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-top: -8px;
}
.card {
  height: 236px;
  padding: 20px;
  display: flex;
  flex-direction: column;
}
.card__top {
  display: flex;
  justify-content: space-between;
}
.card__title {
  margin-top: 14px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.015em;
  line-height: 1.4;
}
.card__title.done {
  font-weight: 500;
  color: var(--ink-600);
}
.card__foot {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.demo-reset {
  padding: 0;
  border: 0;
  border-bottom: 1px solid var(--line-strong);
  background: none;
  color: var(--ink-600);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}
.demo-reset:hover {
  color: var(--sk-red);
  border-bottom-color: var(--sk-red);
}
.foot {
  margin-top: auto;
}
</style>
