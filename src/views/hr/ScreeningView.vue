<script setup>
import { computed, onMounted, ref } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import HairlineTable from '@/components/common/HairlineTable.vue'
import SkeletonBlock from '@/components/common/SkeletonBlock.vue'
import RevealGroup from '@/components/common/RevealGroup.vue'
import RevealItem from '@/components/common/RevealItem.vue'
import InterpretationList from '@/components/hr/InterpretationList.vue'
import ScreeningResultPanel from '@/components/hr/ScreeningResultPanel.vue'
import { useCoursesStore } from '@/stores/courses'
import { useHrStore } from '@/stores/hr'
import { RESULT, useScreeningStore } from '@/stores/screening'
import { useAuthStore } from '@/stores/auth'
import { useDday } from '@/composables/useDday'
import { useSteps } from '@/composables/useSteps'
import { deptLabel } from '@/data/directory'
import { fmtDate } from '@/utils/date'
import { isLlmEnabled } from '@/api/llm'

const courses = useCoursesStore()
const hr = useHrStore()
const screening = useScreeningStore()
const auth = useAuthStore()

/** 해석 → 결과 → 조치 순으로 한 단계씩 연다 */
const steps = useSteps({ beat: 300 })

const input = ref('')
const listDialog = ref(false)
const SUGGESTIONS = [
  '업무상 개인정보를 처리하는 직원 중 개인정보보호 교육 미이수자',
  '산업안전보건교육을 현재 수강 중인 임직원',
  '올해 입사자 중 퇴직연금교육 미이수자',
  '부서별 이수율 하위 3곳',
]

onMounted(async () => {
  if (!courses.items.length) await courses.fetchAll()
  if (!hr.summary) await hr.fetchSummary()
  // 화면에 들어오면 항상 빈 상태에서 시작한다 — 결과는 직접 보낸 뒤에만 나온다
  screening.reset()
  steps.reset()
})

const { label: dday, days } = useDday(computed(() => screening.targetCourse?.deadline))
const isPeople = computed(() => screening.result?.type === RESULT.PEOPLE)
const isRanking = computed(() => screening.result?.type === RESULT.DEPT_RANKING)

const peopleColumns = [
  { key: 'name', label: '이름', width: '92px' },
  { key: 'employeeNo', label: '사번', width: '76px' },
  { key: 'dept', label: '부서', width: '112px' },
  { key: 'job', label: '직무', width: '92px' },
  { key: 'lastTraining', label: '최근 이수' },
  { key: 'dday', label: '마감', width: '68px', align: 'right' },
]
const rankColumns = [
  { key: 'dept', label: '부서', width: '132px' },
  { key: 'head', label: '인원', width: '72px', align: 'right' },
  { key: 'targets', label: '대상 건', width: '84px', align: 'right' },
  { key: 'notDone', label: '미이수 건', width: '92px', align: 'right' },
  { key: 'rate', label: '이수율', align: 'right' },
]
const rankRows = computed(() =>
  (screening.result?.rows ?? []).map((r) => ({ ...r, dept: deptLabel(r.dept) })),
)

async function submit(text) {
  const q = (text ?? input.value).trim()
  if (!q) return
  input.value = q
  steps.reset()
  await screening.run(q)
  if (screening.result) steps.runTo(3)
}

function reset() {
  screening.reset()
  steps.reset()
  input.value = ''
  listDialog.value = false
}

function openListDialog() {
  if (!isPeople.value || !screening.allPeopleRows.length) return
  listDialog.value = true
}

function csvCell(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`
}

function exportPeopleCsv() {
  if (!isPeople.value || !screening.allPeopleRows.length) return

  const courseTitle = screening.targetCourse?.title ?? '전체 과정'
  const rows = [
    ['선별 조건', screening.query],
    ['과정', courseTitle],
    ['대상 인원', `${screening.allPeopleRows.length}명`],
    [],
    ['이름', '사번', '부서', '직무', '입사일', '최근 이수', '마감'],
    ...screening.allPeopleRows.map((row) => [
      row.name,
      row.employeeNo,
      row.dept,
      row.job,
      row.hireDate,
      row.lastTraining ?? '이력 없음',
      dday.value ?? '',
    ]),
  ]
  const csv = `\ufeff${rows.map((row) => row.map(csvCell).join(',')).join('\n')}`
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `대상자명단-${courseTitle}-${new Date().toISOString().slice(0, 10)}.csv`
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
</script>

<template>
  <PageHeader title="대상자 선별">
    <template #subtitle
      >법령의 서술형 대상 조건을 임직원 명단으로 변환합니다 · HR 전용<template
        v-if="!isLlmEnabled()"
      >
        · 규칙 기반 폴백</template
      ></template
    >
    <template #actions>
      <span class="ai-label"><i />AI 지원</span>
      <v-btn variant="outlined" :disabled="!screening.interpretation" @click="reset">새 대화</v-btn>
    </template>
  </PageHeader>

  <div class="body">
    <section class="thread">
      <div v-if="screening.loading" class="ai-loading" aria-live="polite">
        <div class="ai-loading__head">
          <span class="ai-loading__dot" />
          <div>
            <b>조건을 해석하고 명단을 계산하는 중입니다</b>
            <span class="t-small">직무·과정·이수 상태를 순서대로 확인하고 있습니다.</span>
          </div>
        </div>
        <div class="ai-loading__summary">
          <SkeletonBlock :height="14" width="42%" />
          <SkeletonBlock :height="10" width="68%" :delay="0.1" />
        </div>
        <div class="ai-loading__table">
          <SkeletonBlock v-for="i in 6" :key="i" :height="38" :delay="i * 0.08" />
        </div>
      </div>

      <template v-else-if="screening.interpretation">
        <div class="turn">
          <div class="turn__who">HR · {{ auth.profile?.name }}</div>
          <p class="turn__text">{{ screening.query }}</p>
        </div>
        <hr />

        <div class="turn">
          <div class="turn__who"><i class="turn__ai" />AI</div>

          <RevealGroup :ready="steps.reached(1)" :stagger="0.1" :delay="0">
            <RevealItem v-if="steps.reached(1)">
              <p class="turn__text">요청하신 조건을 아래와 같이 해석했습니다.</p>
              <InterpretationList
                :interpretation="screening.interpretation"
                :job-labels="screening.jobLabels"
                :course-title="screening.targetCourse?.title"
                style="margin-top: 16px"
              />
            </RevealItem>

            <!-- 명단 결과 -->
            <RevealItem v-if="steps.reached(2) && isPeople">
              <p class="turn__text" style="margin-top: 16px">
                조건에 해당하는 임직원은 <b class="num t-red">{{ screening.result.total }}</b
                ><b>명</b>입니다.
                <template v-if="days !== null"
                  >마감까지 <b>{{ days }}일</b> 남았습니다.</template
                >
              </p>
              <HairlineTable
                :columns="peopleColumns"
                :rows="screening.peopleRows"
                row-key="userId"
                :row-height="40"
                style="margin-top: 16px"
              >
                <template #cell-name="{ row }"
                  ><b style="font-weight: 500">{{ row.name }}</b></template
                >
                <template #cell-employeeNo="{ row }"
                  ><span class="mono t-small">{{ row.employeeNo }}</span></template
                >
                <template #cell-lastTraining="{ row }">
                  <span v-if="row.lastTraining" class="t-muted"
                    ><span class="mono" style="font-size: 12px">{{
                      fmtDate(row.lastTraining)
                    }}</span>
                    · 만료</span
                  >
                  <span v-else class="t-small">이력 없음</span>
                </template>
                <template #cell-dday
                  ><span class="num t-red" style="font-size: 12px; font-weight: 600">{{
                    dday
                  }}</span></template
                >
              </HairlineTable>
              <p
                v-if="screening.result.total > screening.peopleRows.length"
                class="t-small"
                style="margin-top: 8px"
              >
                {{ screening.peopleRows.length }}명 표시 · 나머지
                {{ screening.result.total - screening.peopleRows.length }}명은 전체 명단에서 확인
              </p>
            </RevealItem>

            <!-- 부서 순위 결과 -->
            <RevealItem v-if="steps.reached(2) && isRanking">
              <p class="turn__text" style="margin-top: 16px">
                이수율이 낮은 부서 <b class="num">{{ screening.result.limit }}</b
                >곳입니다. 미이수 건은 모두 <b class="num t-red">{{ screening.result.total }}</b
                >건입니다.
              </p>
              <HairlineTable
                :columns="rankColumns"
                :rows="rankRows"
                row-key="dept"
                :row-height="44"
                style="margin-top: 16px"
              >
                <template #cell-dept="{ row }"
                  ><b style="font-weight: 500">{{ row.dept }}</b></template
                >
                <template #cell-notDone="{ row }"
                  ><span class="num t-red">{{ row.notDone }}</span></template
                >
                <template #cell-rate="{ row }">
                  <span class="rate">
                    <span class="rate__bar"><i :style="{ width: `${row.rate}%` }" /> </span
                    ><span class="num rate__n">{{ row.rate }}%</span>
                  </span>
                </template>
              </HairlineTable>
            </RevealItem>

            <RevealItem v-if="steps.reached(3) && screening.result">
              <div class="actions">
                <v-btn color="primary" :to="{ name: 'hr-notice' }">
                  {{ isPeople ? `${screening.result.total}명에게 수강 안내 발송` : '부서장 통보' }}
                </v-btn>
                <v-btn
                  v-if="isPeople"
                  type="button"
                  variant="outlined"
                  @click.stop="openListDialog"
                >
                  전체 명단 보기
                </v-btn>
              </div>
            </RevealItem>
          </RevealGroup>

          <p v-if="!steps.reached(1)" class="t-small" style="margin-top: 12px">
            조건을 해석하는 중…
          </p>
        </div>
      </template>

      <div v-else class="empty">
        <p class="t-small" style="margin: 0">
          찾고 싶은 대상을 문장으로 적어 보내세요. 직무 코드로는 뽑을 수 없는 조건도 명단으로 바꿔
          드립니다.
        </p>
      </div>

      <!-- Composer -->
      <form class="composer" @submit.prevent="submit()">
        <div class="suggestions">
          <div class="suggestions__head">
            <span class="suggestions__title"><i />AI 추천 요청 예시</span>
            <span class="t-small">예시를 선택하거나 원하는 조건을 직접 입력할 수 있습니다.</span>
          </div>
          <div class="chips">
            <v-chip v-for="s in SUGGESTIONS" :key="s" variant="outlined" @click="input = s">
              {{ s }}
            </v-chip>
          </div>
        </div>
        <div class="composer__row">
          <input
            v-model="input"
            class="composer__input"
            placeholder="원하는 대상 조건을 자유롭게 입력하세요 · 예) 부서별 이수율 하위 3곳"
          />
          <button
            type="submit"
            class="composer__send"
            :disabled="screening.loading || !input.trim()"
            aria-label="보내기"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M12 19V5M6 11l6-6 6 6" />
            </svg>
          </button>
        </div>
      </form>
    </section>

    <RevealGroup :ready="steps.reached(2)" :stagger="0.1" :delay="0">
      <RevealItem v-if="steps.reached(2) && isPeople">
        <ScreeningResultPanel
          :result="screening.result"
          :course="screening.targetCourse"
          :status="screening.interpretation?.status ?? 'NOT_COMPLETED'"
          :dday="dday"
        />
      </RevealItem>
    </RevealGroup>
  </div>

  <Teleport to="body">
    <div
      v-if="listDialog"
      class="list-modal-backdrop"
      role="presentation"
      @click.self="listDialog = false"
      @keydown.esc="listDialog = false"
    >
      <section class="list-modal" role="dialog" aria-modal="true" aria-labelledby="list-title">
        <header class="list-modal__head">
          <div>
            <span class="t-label">선별 결과</span>
            <h2 id="list-title">전체 대상자 명단</h2>
            <p>{{ screening.targetCourse?.title ?? '전체 과정' }} · {{ dday }}</p>
          </div>
          <div class="list-modal__actions">
            <v-btn variant="outlined" @click="exportPeopleCsv">CSV 내보내기</v-btn>
            <button type="button" class="list-modal__close" @click="listDialog = false">
              닫기
            </button>
          </div>
        </header>

        <div class="list-modal__summary">
          <div>
            <span class="t-label">전체 대상</span>
            <b class="num">{{ screening.allPeopleRows.length }}</b
            ><small>명</small>
          </div>
          <p>{{ screening.query }}</p>
        </div>

        <div class="list-modal__body">
          <HairlineTable
            :columns="peopleColumns"
            :rows="screening.allPeopleRows"
            row-key="userId"
            :row-height="40"
          >
            <template #cell-name="{ row }"
              ><b>{{ row.name }}</b></template
            >
            <template #cell-employeeNo="{ row }">
              <span class="mono t-small">{{ row.employeeNo }}</span>
            </template>
            <template #cell-lastTraining="{ row }">
              <span v-if="row.lastTraining" class="t-muted">
                <span class="mono" style="font-size: 12px">{{ fmtDate(row.lastTraining) }}</span>
                · 만료
              </span>
              <span v-else class="t-small">이력 없음</span>
            </template>
            <template #cell-dday>
              <span class="num t-red list-modal__dday">{{ dday }}</span>
            </template>
          </HairlineTable>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.ai-loading {
  padding: 18px 0 4px;
}
.ai-loading__head {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.ai-loading__head b,
.ai-loading__head span {
  display: block;
}
.ai-loading__head b {
  font-size: 14px;
  font-weight: 500;
}
.ai-loading__head span {
  margin-top: 3px;
}
.ai-loading__dot {
  width: 8px;
  height: 8px;
  margin-top: 6px;
  border-radius: 50%;
  background: var(--sk-teal);
  animation: thinking 1s ease-in-out infinite;
}
.ai-loading__summary {
  display: flex;
  flex-direction: column;
  gap: 9px;
  margin-top: 24px;
}
.ai-loading__table {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 18px;
}
@keyframes thinking {
  0%,
  100% {
    opacity: 0.35;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
}
.ai-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--sk-teal);
  letter-spacing: 0.04em;
}
.ai-label i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--sk-teal);
}
.body {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 48px;
  flex-grow: 1;
}
.thread {
  display: flex;
  flex-direction: column;
}
.turn__who {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.04em;
  display: flex;
  align-items: center;
  gap: 6px;
}
.turn__ai {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--sk-red);
}
.turn__text {
  margin: 8px 0 0;
  font-size: 15px;
  line-height: 1.55;
}
hr {
  border: 0;
  border-top: 1px solid var(--line);
  margin: 24px 0;
}
.empty {
  max-width: 420px;
  line-height: 1.7;
}
.actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}
.rate {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  justify-content: flex-end;
  width: 100%;
}
.rate__bar {
  flex-grow: 1;
  max-width: 92px;
  height: 4px;
  background: var(--surface-muted);
  display: block;
}
.rate__bar i {
  display: block;
  height: 100%;
  background: var(--sk-teal);
}
.rate__n {
  font-size: 12px;
  font-weight: 500;
  min-width: 44px;
  text-align: right;
}
.composer {
  margin-top: auto;
  padding-top: 24px;
}
.suggestions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.suggestions__head {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.suggestions__title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--sk-teal);
  letter-spacing: 0.04em;
}
.suggestions__title i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--sk-teal);
}
.chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.composer__row {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  margin-top: 12px;
}
.composer__input {
  flex-grow: 1;
  height: 44px;
  border: 0;
  border-bottom: 1px solid var(--ink-900);
  background: none;
  font: inherit;
  font-size: 15px;
  outline: none;
}
.composer__send {
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: var(--radius);
  background: var(--ink-900);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.composer__send:disabled {
  opacity: 0.4;
}
.list-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2400;
  display: grid;
  place-items: center;
  padding: 32px;
  background: rgba(20, 20, 20, 0.42);
}
.list-modal {
  display: flex;
  flex-direction: column;
  width: min(1080px, 100%);
  max-height: min(820px, calc(100vh - 64px));
  padding: 24px;
  overflow: hidden;
  background: var(--surface);
  border: 1px solid var(--line);
}
.list-modal__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--line-strong);
}
.list-modal__head h2 {
  margin: 5px 0 0;
  font-size: 20px;
  font-weight: 600;
}
.list-modal__head p {
  margin: 4px 0 0;
  color: var(--ink-600);
  font-size: 12px;
}
.list-modal__actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}
.list-modal__close {
  padding: 8px 0;
  border: 0;
  background: none;
  color: var(--ink-600);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}
.list-modal__close:hover {
  color: var(--sk-red);
}
.list-modal__summary {
  display: flex;
  align-items: flex-end;
  gap: 24px;
  padding: 16px 0;
  border-bottom: 1px solid var(--line);
}
.list-modal__summary > div {
  min-width: 104px;
}
.list-modal__summary span,
.list-modal__summary b,
.list-modal__summary small {
  display: inline-block;
}
.list-modal__summary span {
  display: block;
}
.list-modal__summary b {
  margin-top: 4px;
  font-size: 28px;
  line-height: 1;
}
.list-modal__summary small {
  margin-left: 4px;
  color: var(--ink-600);
}
.list-modal__summary p {
  margin: 0 0 2px;
  color: var(--ink-600);
  font-size: 12px;
}
.list-modal__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 12px 4px 12px 0;
}
.list-modal__body b {
  font-weight: 500;
}
.list-modal__dday {
  font-size: 12px;
  font-weight: 600;
}
</style>
