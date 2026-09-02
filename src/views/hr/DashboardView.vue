<script setup>
import { computed, onMounted, ref } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import RevealGroup from '@/components/common/RevealGroup.vue'
import RevealItem from '@/components/common/RevealItem.vue'
import SkeletonBlock from '@/components/common/SkeletonBlock.vue'
import StatStrip from '@/components/hr/StatStrip.vue'
import CourseProgressList from '@/components/hr/CourseProgressList.vue'
import StatusSummary from '@/components/hr/StatusSummary.vue'
import ImminentTiles from '@/components/hr/ImminentTiles.vue'
import { useCoursesStore } from '@/stores/courses'
import { useHrStore } from '@/stores/hr'
import { useDday, today } from '@/composables/useDday'
import { fmtDate, fmtDday } from '@/utils/date'

const courses = useCoursesStore()
const hr = useHrStore()
const listDialog = ref(false)
const selectedCourseId = ref(null)

/**
 * 화면은 각 요청이 끝나는 순서대로 열린다: 과정 목록 → 전사 집계 → AI 선별 명단.
 * 열림 조건이 모두 실제 데이터라 실서버에 붙여도 같은 순서로 채워진다.
 */
const summaryReady = computed(() => Boolean(hr.summary))
const rowsReady = computed(() => hr.courseRows.length > 0)
const courseChoices = computed(() =>
  [...hr.courseRows]
    .filter((item) => item.course?.deadline)
    .sort((a, b) => a.course.deadline.localeCompare(b.course.deadline)),
)
const selectedRow = computed(
  () => hr.courseRows.find((item) => item.courseId === selectedCourseId.value) ?? hr.urgent ?? null,
)
const selectedCourse = computed(() => selectedRow.value?.course ?? null)
const selectedPeople = computed(() => hr.peopleForCourse(selectedCourse.value))
const listReady = computed(() => selectedPeople.value.length > 0)

onMounted(async () => {
  if (!courses.items.length) await courses.fetchAll()
  await hr.fetchSummary()
  selectedCourseId.value = hr.urgent?.courseId ?? courseChoices.value[0]?.courseId ?? null
})

const urgentCourse = computed(() => hr.urgent?.course ?? null)
const { label: urgentDday } = useDday(computed(() => urgentCourse.value?.deadline))
const { label: selectedDday } = useDday(computed(() => selectedCourse.value?.deadline))

function selectCourse(row) {
  selectedCourseId.value = row.courseId
}

function openList(row = selectedRow.value) {
  if (row?.courseId) selectedCourseId.value = row.courseId
  listDialog.value = true
}

const stats = computed(() => {
  const s = hr.summary
  if (!s) return []
  const pct = (n) => Number(((n / s.headcount) * 100).toFixed(1))
  return [
    {
      label: '관리 대상 임직원',
      value: s.headcount,
      sub: `${courses.items.length}개 법정의무교육`,
    },
    {
      label: '전 과정 이수 완료',
      value: pct(s.completedAll),
      decimals: 1,
      unit: '%',
      sub: `<span class="num">${s.completedAll.toLocaleString()}</span>명`,
    },
    {
      label: '일부 진행 중',
      value: s.partial,
      sub: `${pct(s.partial)}% · 신청 후 이수 전`,
    },
    {
      label: '미착수',
      value: s.notStarted,
      tone: 'red',
      dot: 'var(--sk-red)',
      sub: urgentCourse.value
        ? `${pct(s.notStarted)}% · ${urgentCourse.value.title.replace(' 및 정보보안 교육', ' 미이수')} <b class="t-red">${hr.urgent.notDoneCount}명</b> ${urgentDday.value}`
        : `${pct(s.notStarted)}%`,
    },
  ]
})
</script>

<template>
  <PageHeader title="전사 이수 현황">
    <template #subtitle>{{ today().getFullYear() }}년 · {{ fmtDate(today()) }} 기준</template>
    <template #actions>
      <v-btn color="primary" :to="{ name: 'hr-screening' }">대상자 선별</v-btn>
    </template>
  </PageHeader>

  <StatStrip :stats="stats" :ready="summaryReady" />

  <RevealGroup :ready="rowsReady" :stagger="0.1" :delay="0">
    <RevealItem v-if="hr.summary" class="two-col">
      <CourseProgressList :rows="hr.courseRows" />
      <StatusSummary :summary="hr.summary">
        <template #footer>
          <template v-if="urgentCourse">
            "{{ urgentCourse.targetRule }}" 조건을 기준으로 집계한 결과입니다.
            <button type="button" class="text-link footer-link" @click="openList(hr.urgent)">
              미이수자 명단 확인 →
            </button>
          </template>
        </template>
      </StatusSummary>
    </RevealItem>
  </RevealGroup>

  <RevealGroup :ready="rowsReady" :stagger="0.1" :delay="0.05">
    <RevealItem>
      <div class="course-filter__head">
        <h2 class="t-h2">과정별 관리 현황</h2>
        <span class="t-small">마감 임박순 · 과정을 선택하면 명단이 바뀝니다</span>
      </div>
      <div class="course-filter">
        <button
          v-for="(item, index) in courseChoices"
          :key="item.courseId"
          type="button"
          :class="{ active: item.courseId === selectedRow?.courseId }"
          @click="selectCourse(item)"
        >
          <span class="mono course-filter__index">{{ String(index + 1).padStart(2, '0') }}</span>
          <strong>{{ item.course.title }}</strong>
          <span class="course-filter__meta">
            <b class="mono">{{ fmtDday(item.course.deadline, today()) }}</b>
            · 미이수 <span class="num">{{ item.notDoneCount }}</span
            >명
          </span>
        </button>
      </div>

      <div class="imminent__head">
        <div>
          <h2 class="t-h2" style="margin: 0; display: inline">선택 과정 미이수자</h2>
          <span v-if="listReady" class="t-small" style="margin-left: 12px">
            {{ selectedCourse?.title }} · {{ selectedDday }} ·
            <b class="num t-red">{{ selectedRow?.notDoneCount }}</b
            >명
          </span>
          <span v-else class="t-small" style="margin-left: 12px">명단을 뽑는 중…</span>
        </div>
        <button type="button" class="text-link t-small" @click="openList()">전체 명단</button>
      </div>
      <RevealGroup v-if="listReady" :ready="listReady" :stagger="0.08" :delay="0">
        <RevealItem>
          <ImminentTiles
            :people="selectedPeople.slice(0, 3)"
            :dday="selectedDday"
            style="margin-top: 16px"
          />
        </RevealItem>
      </RevealGroup>
      <div v-if="!listReady" class="imminent__skeleton">
        <div v-for="i in 3" :key="i" class="imminent__cell">
          <SkeletonBlock :height="12" width="50%" :delay="i * 0.12" />
          <SkeletonBlock :height="16" width="70%" :delay="i * 0.12" style="margin-top: 12px" />
          <SkeletonBlock :height="12" width="60%" :delay="i * 0.12" style="margin-top: 10px" />
        </div>
      </div>
    </RevealItem>
  </RevealGroup>

  <v-dialog v-model="listDialog" width="calc(100% - 48px)" max-width="960">
    <v-card class="list-modal">
      <div class="list-modal__head">
        <div>
          <div class="t-label">미이수자 관리</div>
          <h2>{{ selectedCourse?.title }}</h2>
          <p class="t-small">{{ selectedCourse?.targetRule }} · 마감 {{ selectedDday }}</p>
        </div>
        <button type="button" class="list-modal__close" @click="listDialog = false">닫기</button>
      </div>

      <div class="list-modal__summary">
        <span>현재 미이수</span>
        <b class="num t-red">{{ selectedPeople.length }}</b>
        <small>명</small>
        <span class="list-modal__summary-note">팀원 이름을 우선으로 표시합니다.</span>
      </div>

      <div class="list-modal__body">
        <table class="people-table">
          <thead>
            <tr>
              <th>이름</th>
              <th>사번</th>
              <th>부서</th>
              <th>직무</th>
              <th>최근 이수</th>
              <th class="people-table__right">마감</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="person in selectedPeople" :key="person.userId">
              <td class="people-table__name">{{ person.name }}</td>
              <td class="mono">{{ person.employeeNo }}</td>
              <td>{{ person.dept }}</td>
              <td>{{ person.job }}</td>
              <td>
                <template v-if="person.lastTraining">
                  <span class="mono">{{ fmtDate(person.lastTraining) }}</span>
                  <span class="t-small"> · 만료</span>
                </template>
                <span v-else class="t-small">이력 없음</span>
              </td>
              <td class="num t-red people-table__right">{{ selectedDday }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.two-col {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 48px;
}
.footer-link {
  display: inline-block;
  margin-top: 12px;
  font-weight: 500;
}
.text-link {
  padding: 0;
  border: 0;
  border-bottom: 1px solid var(--line-strong);
  background: none;
  color: var(--ink-600);
  font: inherit;
  cursor: pointer;
}
.text-link:hover {
  color: var(--sk-red);
  border-bottom-color: var(--sk-red);
}
.course-filter__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}
.course-filter__head .t-h2 {
  margin: 0;
}
.course-filter {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
  margin-top: 14px;
}
.course-filter button {
  min-width: 0;
  min-height: 92px;
  padding: 12px 14px;
  border: 1px solid var(--line);
  border-left: 2px solid transparent;
  background: #fff;
  color: var(--ink-600);
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.course-filter button:hover {
  border-color: var(--line-strong);
  color: var(--ink-900);
}
.course-filter button.active {
  border-left-color: var(--sk-red);
  background: var(--sk-red-tint);
  color: var(--ink-900);
}
.course-filter__index {
  display: block;
  color: var(--ink-400);
  font-size: 10px;
}
.course-filter strong {
  display: block;
  margin-top: 5px;
  overflow: hidden;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.course-filter__meta {
  display: block;
  margin-top: 8px;
  font-size: 11px;
  color: var(--ink-400);
}
.course-filter button.active .course-filter__meta b {
  color: var(--sk-red-text);
}
.imminent__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-top: 24px;
}
.imminent__skeleton {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-top: 16px;
}
.imminent__cell {
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 16px 18px;
  height: 96px;
}
.list-modal {
  padding: 28px 32px 32px;
}
.list-modal__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--line-strong);
}
.list-modal__head h2 {
  margin: 6px 0 0;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.list-modal__head p {
  margin: 6px 0 0;
}
.list-modal__close {
  padding: 0;
  border: 0;
  background: none;
  color: var(--ink-400);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}
.list-modal__summary {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-height: 56px;
  padding: 14px 0;
  border-bottom: 1px solid var(--line);
  font-size: 13px;
  color: var(--ink-600);
}
.list-modal__summary b {
  margin-left: 8px;
  font-size: 26px;
  line-height: 1;
  font-weight: 600;
}
.list-modal__summary small {
  font-size: 12px;
}
.list-modal__summary-note {
  margin-left: auto;
  color: var(--ink-400);
  font-size: 11px;
}
.list-modal__body {
  max-height: 60vh;
  overflow: auto;
}
.people-table {
  width: 100%;
  min-width: 720px;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 13px;
}
.people-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  height: 32px;
  padding: 0 10px;
  border-bottom: 1px solid var(--line-strong);
  background: #fff;
  color: var(--ink-400);
  font-size: 11px;
  font-weight: 400;
  text-align: left;
}
.people-table td {
  height: 42px;
  padding: 0 10px;
  border-bottom: 1px solid var(--line);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.people-table th:nth-child(1),
.people-table td:nth-child(1) {
  width: 108px;
}
.people-table th:nth-child(2),
.people-table td:nth-child(2) {
  width: 88px;
}
.people-table th:nth-child(3),
.people-table td:nth-child(3) {
  width: 112px;
}
.people-table th:nth-child(4),
.people-table td:nth-child(4) {
  width: 96px;
}
.people-table th:nth-child(6),
.people-table td:nth-child(6) {
  width: 72px;
}
.people-table__name {
  font-weight: 600;
  color: var(--ink-900);
}
.people-table__right {
  text-align: right !important;
  font-weight: 600;
}
</style>
