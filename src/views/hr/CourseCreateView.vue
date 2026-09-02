<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import PageHeader from '@/components/common/PageHeader.vue'
import RevealGroup from '@/components/common/RevealGroup.vue'
import RevealItem from '@/components/common/RevealItem.vue'
import AnimatedNumber from '@/components/common/AnimatedNumber.vue'
import LawPasteBlock from '@/components/hr/LawPasteBlock.vue'
import { autofillCourse } from '@/api/llm'
import { LEGAL_COURSE_TYPES, defaultDeadline, findCourseType } from '@/data/legalCourses'
import { DIRECTORY, JOBS, jobLabel } from '@/data/directory'
import { useCoursesStore } from '@/stores/courses'
import { useHrStore } from '@/stores/hr'
import { useSteps } from '@/composables/useSteps'
import { today } from '@/composables/useDday'
import { fmtMonthDay } from '@/utils/date'

const router = useRouter()
const courses = useCoursesStore()
const hr = useHrStore()

/**
 * 등록 절차는 한 번에 펼치지 않는다.
 * 00 입력 → (AI 응답) → 01 기본 정보 → 02 이수 기준 → 03 대상자 조건 순으로 열린다.
 * 단계는 AI 응답이 실제로 도착한 뒤에만 진행하므로 실서버에서도 같은 순서다.
 */
const steps = useSteps({ beat: 260 })

const SECTIONS = [
  { n: '00', label: '입력' },
  { n: '01', label: '기본 정보' },
  { n: '02', label: '이수 기준' },
  { n: '03', label: '대상자 조건' },
]

const LAW_SUGGESTIONS = [
  {
    label: '개인정보보호 교육',
    lawText:
      '개인정보보호법 제28조 ① 개인정보처리자는 개인정보의 안전한 관리를 위하여 필요한 교육을 실시하여야 한다. 연 1회 이상, 60분 이상 권장',
    targetText: '업무상 개인정보를 처리하는 자',
  },
  {
    label: '산업안전보건 교육',
    lawText:
      '산업안전보건법 제29조에 따라 사업주는 소속 근로자에게 정기적으로 안전보건교육을 실시하여야 한다. 연 1회 이상 교육',
    targetText: '전 임직원',
  },
]

const lawText = ref('')
const targetConditionText = ref('')
const submittedTargetText = ref('')
const form = reactive({
  title: '',
  typeKey: 'PRIVACY',
  law: '',
  cycle: '',
  minutes: 60,
  deadline: '',
  targetRule: '',
  targetJobs: [],
  category: 'SECURITY',
})
/** AI가 채운 필드 — 라벨에 초록 점 표시 */
const filled = ref(new Set())
const parsed = ref(null)
const loading = ref(false)
const saving = ref(false)

const typeItems = LEGAL_COURSE_TYPES.map((t) => ({ title: t.name, value: t.key }))
const jobItems = Object.entries(JOBS).map(([value, title]) => ({ title, value }))

const markFilled = (...keys) => (filled.value = new Set([...filled.value, ...keys]))

async function interpret() {
  if (loading.value || !lawText.value.trim() || !targetConditionText.value.trim()) return
  submittedTargetText.value = targetConditionText.value.trim()
  steps.reset()
  filled.value = new Set()
  parsed.value = null
  loading.value = true
  try {
    parsed.value = await autofillCourse({
      lawText: lawText.value,
      targetText: targetConditionText.value,
    })
  } finally {
    loading.value = false
  }
  if (parsed.value) steps.runTo(3)
}

/** 도착한 해석 결과를 단계에 맞춰 조금씩 반영한다 */
watch(
  () => steps.step.value,
  (n) => {
    const r = parsed.value
    if (!r) return
    const type = findCourseType(r.typeKey)

    if (n >= 1) {
      form.title = r.title
      form.typeKey = r.typeKey
      form.law = r.law || type?.law || ''
      form.category = type?.category ?? 'OTHER'
      markFilled('title', 'typeKey', 'law')
    }
    if (n >= 2) {
      form.cycle = r.cycle || type?.cycle || ''
      form.minutes = r.minutes || type?.minutes || 60
      // 마감일은 백엔드에 없는 값 — 프론트 기준 데이터에서 가져온다
      form.deadline = r.deadline || defaultDeadline(type, today().getFullYear()) || ''
      markFilled('cycle', 'minutes', 'deadline')
    }
    if (n >= 3) {
      form.targetRule = r.targetRule || type?.targetRule || ''
      form.targetJobs = r.targetJobs?.length ? r.targetJobs : (type?.defaultTargetJobs ?? [])
      markFilled('targetRule', 'targetJobs')
    }
  },
)

const isFilled = (key) => filled.value.has(key)

/** 해석된 대상자 수 — 집계에 이 유형이 있으면 그 대상 수를, 없으면 디렉터리로 환산 */
const targetCount = computed(() => {
  const head = hr.summary?.headcount ?? DIRECTORY.length
  if (!form.targetJobs.length) return head
  const row = hr.courseRows.find((r) => r.course?.typeKey === form.typeKey)
  if (row?.targets) return row.targets
  const inScope = DIRECTORY.filter((e) => form.targetJobs.includes(e.job)).length
  if (head === DIRECTORY.length) return inScope
  return Math.round(head * (inScope / DIRECTORY.length))
})
const headcount = computed(() => hr.summary?.headcount ?? DIRECTORY.length)
const includedJobs = computed(() => form.targetJobs.map(jobLabel))
const excludedJobs = computed(() =>
  jobItems.filter((item) => !form.targetJobs.includes(item.value)).map((item) => item.title),
)
const targetEvidence = computed(
  () => parsed.value?.targetEvidence || submittedTargetText.value || form.targetRule,
)
/**
 * AI 문장에 남은 직무 코드를 한글 직무명으로 정리한다.
 * "연구개발(RND)"처럼 괄호로 덧붙인 코드는 지우고, 홀로 쓰인 코드만 직무명으로 바꾼다.
 */
const withJobLabels = (text) => {
  const codes = Object.keys(JOBS).sort((a, b) => b.length - a.length)
  const stripped = codes.reduce((acc, code) => acc.replaceAll(`(${code})`, ''), text)
  return codes.reduce((acc, code) => acc.replaceAll(code, jobLabel(code)), stripped)
}

const targetRationale = computed(() =>
  parsed.value?.targetRationale
    ? withJobLabels(parsed.value.targetRationale)
    : '입력한 조건을 직무 정보에 적용했습니다. 포함·제외 직무는 등록 전에 조정할 수 있습니다.',
)
const impact = computed(() => {
  const row = hr.courseRows.find((r) => r.course?.typeKey === form.typeKey)
  if (!row) return null
  const pct = (p) => Math.round((targetCount.value * p) / 100)
  return { done: pct(row.done), inProgress: pct(row.inProgress), notDone: pct(row.notDone) }
})
const dday = computed(() => {
  if (!form.deadline) return ''
  const diff = Math.round((new Date(form.deadline) - today()) / 86_400_000)
  return diff >= 0 ? `D-${diff}` : `D+${Math.abs(diff)}`
})
const penaltyCap = computed(() => {
  const cap = findCourseType(form.typeKey)?.penalty?.cap
  return cap ? (cap / 10000).toLocaleString() : null
})

async function submit() {
  saving.value = true
  try {
    await courses.create({ ...form })
    router.push({ name: 'hr-dashboard' })
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  if (!courses.items.length) await courses.fetchAll()
  if (!hr.summary) await hr.fetchSummary()
})
</script>

<template>
  <PageHeader title="법정의무교육 과정 등록">
    <template #subtitle>법령과 대상 조건을 입력하면 직무·인원으로 변환합니다 · HR 전용</template>
    <template #actions>
      <v-btn variant="outlined">임시 저장</v-btn>
      <v-btn color="primary" :loading="saving" :disabled="!steps.reached(3)" @click="submit"
        >과정 등록</v-btn
      >
    </template>
  </PageHeader>

  <!-- 진행 상태 — 상자 대신 얇은 눈금으로 -->
  <ol class="rail">
    <li v-for="(s, i) in SECTIONS" :key="s.n" :class="{ on: steps.reached(i) || i === 0 }">
      <span class="mono">{{ s.n }}</span>
      <span class="rail__label">{{ s.label }}</span>
    </li>
  </ol>

  <div class="body">
    <form class="form" @submit.prevent="submit">
      <LawPasteBlock
        v-model:law-text="lawText"
        v-model:target-text="targetConditionText"
        :filled-count="filled.size"
        :loading="loading"
        :suggestions="LAW_SUGGESTIONS"
        @interpret="interpret"
      />

      <!-- 01 기본 정보 -->
      <RevealGroup :ready="steps.reached(1)" :stagger="0.07" :delay="0">
        <RevealItem v-if="steps.reached(1)">
          <h3 class="sec">01 — 기본 정보</h3>
          <div class="fields">
            <v-text-field
              v-model="form.title"
              class="span-all"
              :class="{ filled: isFilled('title') }"
              label="과정명"
            />
            <v-select
              v-model="form.typeKey"
              :items="typeItems"
              :class="{ filled: isFilled('typeKey') }"
              label="교육 유형"
            />
            <v-text-field
              v-model="form.law"
              :class="{ filled: isFilled('law') }"
              label="법정 근거"
            />
          </div>
        </RevealItem>
      </RevealGroup>

      <!-- 02 이수 기준 -->
      <RevealGroup :ready="steps.reached(2)" :stagger="0.07" :delay="0">
        <RevealItem v-if="steps.reached(2)">
          <h3 class="sec">02 — 이수 기준</h3>
          <div class="fields fields--4">
            <v-text-field
              v-model="form.cycle"
              :class="{ filled: isFilled('cycle') }"
              label="실시 주기"
            />
            <v-text-field
              v-model.number="form.minutes"
              :class="{ filled: isFilled('minutes') }"
              label="최소 이수시간(분)"
              type="number"
            />
            <v-text-field
              v-model="form.deadline"
              :class="{ filled: isFilled('deadline') }"
              label="이수 마감일"
              type="date"
            />
            <v-text-field model-value="0" label="수강료 (회사 부담)" readonly />
          </div>
        </RevealItem>
      </RevealGroup>

      <!-- 03 대상자 조건 -->
      <RevealGroup :ready="steps.reached(3)" :stagger="0.07" :delay="0">
        <RevealItem v-if="steps.reached(3)">
          <h3 class="sec">
            03 — 대상자 조건
            <span class="sec__note">서술형 조건을 조회 조건으로 변환한 결과입니다</span>
          </h3>

          <!-- 변환 과정: 화살표 대신 정의형 3행 -->
          <dl class="map">
            <dt>입력한 조건</dt>
            <dd class="map__quote">“{{ targetEvidence }}”</dd>

            <dt>조회 조건</dt>
            <dd>
              직무 <b class="num">{{ form.targetJobs.length }}</b
              >종 — {{ includedJobs.join(' · ') || '없음' }}
            </dd>

            <dt>적용 결과</dt>
            <dd class="map__result">
              <AnimatedNumber :value="targetCount" :duration="700" />
              <span class="map__unit">명</span>
              <span class="t-small"
                >전사 <span class="num">{{ headcount.toLocaleString() }}</span
                >명 중</span
              >
            </dd>
          </dl>

          <p class="rationale">{{ targetRationale }}</p>

          <div class="fields">
            <v-text-field v-model="form.targetRule" label="조회 조건 문구" />
            <v-select
              v-model="form.targetJobs"
              :items="jobItems"
              multiple
              chips
              closable-chips
              label="적용 대상 직무"
            />
          </div>
          <p class="excluded">
            제외 <span>{{ excludedJobs.join(' · ') || '없음' }}</span>
          </p>
        </RevealItem>
      </RevealGroup>

      <p v-if="!steps.reached(1) && !loading" class="waiting">
        해석을 실행하면 기본 정보 · 이수 기준 · 대상자 조건이 차례로 채워집니다.
      </p>
    </form>

    <aside class="side">
      <RevealGroup :ready="steps.reached(1)" :stagger="0.12" :delay="0">
        <RevealItem v-if="steps.reached(1)">
          <div class="t-label">미리보기 — 임직원 화면</div>
          <div class="preview">
            <div class="preview__meta">
              <span class="t-label">필수 · {{ form.law }}</span>
              <span v-if="dday" class="num t-red preview__dday">{{ dday }}</span>
            </div>
            <div class="preview__title">{{ form.title || '과정명' }}</div>
            <div class="t-small" style="margin-top: 8px">
              <span class="num">{{ form.minutes }}</span
              >분 · 마감
              <span class="mono">{{ form.deadline ? fmtMonthDay(form.deadline) : '-' }}</span>
            </div>
            <v-btn color="primary" block height="36" style="margin-top: 18px">수강신청</v-btn>
          </div>
        </RevealItem>

        <RevealItem v-if="steps.reached(3)">
          <div class="t-label impact__head">등록 시 영향</div>
          <ul class="impact">
            <li>
              <span>해석된 대상자</span><b class="num">{{ targetCount }}</b>
            </li>
            <li>
              <span>기이수 인정</span><b class="num">{{ impact?.done ?? '—' }}</b>
            </li>
            <li>
              <span>이수 필요</span
              ><b class="num t-red">{{ impact ? impact.inProgress + impact.notDone : '—' }}</b>
            </li>
          </ul>
          <p v-if="impact" class="t-small" style="margin-top: 10px">
            이수 필요 = 진행 {{ impact.inProgress }} + 미이수 {{ impact.notDone }}
          </p>
        </RevealItem>
      </RevealGroup>

      <p v-if="steps.reached(1) && penaltyCap" class="side__foot">
        미이수 시 사업장당 최대 <b>{{ penaltyCap }}만원</b>의 과태료가 부과될 수 있습니다.
      </p>
    </aside>
  </div>
</template>

<style scoped>
/* 진행 눈금 */
.rail {
  list-style: none;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 2px;
  margin: -8px 0 0;
  padding: 0;
}
.rail li {
  border-top: 2px solid var(--line);
  padding-top: 8px;
  display: flex;
  align-items: baseline;
  gap: 8px;
  color: var(--ink-400);
  font-size: 12px;
  transition:
    border-color 0.3s ease,
    color 0.3s ease;
}
.rail li.on {
  border-top-color: var(--ink-900);
  color: var(--ink-900);
}
.rail__label {
  letter-spacing: -0.01em;
}

.body {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 48px;
  align-items: start;
}
.form {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

/* 섹션 제목 — 상자 대신 굵은 헤어라인 */
.sec {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin: 44px 0 0;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--ink-900);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.02em;
}
.sec__note {
  font-size: 11px;
  font-weight: 400;
  color: var(--ink-400);
  letter-spacing: 0;
}

/**
 * Vuetify 입력은 아래 여백이 0이라 그대로 두면 행이 붙는다.
 * 필드는 이 그리드에만 담고 세로 리듬을 여기서 준다.
 */
.fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px 32px;
  margin-top: 22px;
}
.fields--4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
.span-all {
  grid-column: 1 / -1;
}

/* 변환 과정 */
.map {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  margin: 26px 0 0;
}
.map dt,
.map dd {
  margin: 0;
  padding: 11px 0;
  border-bottom: 1px solid var(--line);
  font-size: 13px;
  line-height: 1.5;
}
.map dt {
  color: var(--ink-400);
  font-size: 11px;
  letter-spacing: 0.04em;
  padding-top: 14px;
}
.map__quote {
  font-weight: 500;
}
.map dd b {
  font-weight: 600;
}
.map__result {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: 26px;
  font-weight: 500;
  letter-spacing: -0.03em;
  padding-top: 6px !important;
}
.map__unit {
  font-size: 14px;
  font-weight: 500;
}
.map__result .t-small {
  margin-left: 6px;
}
.rationale {
  margin: 20px 0 0;
  padding: 2px 0 2px 14px;
  border-left: 2px solid var(--sk-teal);
  font-size: 12px;
  line-height: 1.7;
  color: var(--ink-600);
}
.excluded {
  margin: 14px 0 0;
  font-size: 11px;
  color: var(--ink-400);
}
.excluded span {
  color: var(--ink-600);
}
.waiting {
  margin: 28px 0 0;
  font-size: 13px;
  color: var(--ink-400);
}

/* AI가 채운 필드 라벨에 초록 점 */
:deep(.filled .v-label::after) {
  content: '';
  display: inline-block;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--sk-teal);
  margin-left: 6px;
  vertical-align: middle;
}

/* 우측 */
.side {
  min-width: 0;
  border-left: 1px solid var(--line);
  padding-left: 48px;
  display: flex;
  flex-direction: column;
  min-height: 420px;
}
.preview {
  margin-top: 14px;
  border: 1px solid var(--line);
  border-top: 3px solid var(--sk-red);
  border-radius: var(--radius);
  background: var(--surface);
  padding: 20px;
}
.preview__meta {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}
.preview__dday {
  font-weight: 600;
  font-size: 12px;
}
.preview__title {
  margin-top: 12px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.015em;
  line-height: 1.35;
}
.impact__head {
  margin-top: 36px;
}
.impact {
  list-style: none;
  margin: 10px 0 0;
  padding: 0;
  border-top: 1px solid var(--line-strong);
}
.impact li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 42px;
  border-bottom: 1px solid var(--line);
  font-size: 13px;
  color: var(--ink-600);
}
.impact b {
  font-size: 18px;
  font-weight: 500;
  letter-spacing: -0.02em;
  color: var(--ink-900);
}
.side__foot {
  margin: auto 0 0;
  padding-top: 20px;
  border-top: 1px solid var(--line);
  font-size: 12px;
  line-height: 1.6;
  color: var(--ink-600);
}
.side__foot b {
  color: var(--ink-900);
  font-weight: 600;
}
</style>
