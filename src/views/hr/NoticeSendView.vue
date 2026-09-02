<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import NoticeDraftEditor from '@/components/hr/NoticeDraftEditor.vue'
import SendSettings from '@/components/hr/SendSettings.vue'
import RevealGroup from '@/components/common/RevealGroup.vue'
import RevealItem from '@/components/common/RevealItem.vue'
import { draftNotice } from '@/api/llm'
import { useCoursesStore } from '@/stores/courses'
import { useHrStore } from '@/stores/hr'
import { today, useDday } from '@/composables/useDday'
import { useSteps } from '@/composables/useSteps'
import { fmtDday, fmtMonthDay } from '@/utils/date'

const courses = useCoursesStore()
const hr = useHrStore()
const selectedCourseId = ref(null)

const courseChoices = computed(() =>
  [...hr.courseRows]
    .filter((item) => item.course?.deadline)
    .sort((a, b) => a.course.deadline.localeCompare(b.course.deadline)),
)
const selectedRow = computed(
  () => hr.courseRows.find((item) => item.courseId === selectedCourseId.value) ?? hr.urgent ?? null,
)
const course = computed(() => selectedRow.value?.course ?? null)
const targets = computed(() => hr.targetsForCourse(course.value))

const GROUPS = [
  {
    key: 'NEW',
    label: '이력 없음 · 신규 대상',
    sub: '첫 안내',
    count: () => targets.value?.none ?? 0,
  },
  {
    key: 'RENEWAL',
    label: '작년 이수 · 갱신 필요',
    sub: '갱신 안내',
    count: () => targets.value?.expired ?? 0,
  },
]
/** 대상 그룹 → 문안 → 발송 설정 순으로 연다 */
const steps = useSteps({ beat: 280 })
const group = ref('NEW')
const tone = ref('정중')
const draft = ref({ subject: '', body: '' })
const loading = ref(false)
const sent = ref(false)
const settings = reactive({
  channels: { mail: true, messenger: true, sms: false },
  when: 'NOW',
  remind: true,
})

const total = computed(() => targets.value?.total ?? 0)
const { label: dday } = useDday(computed(() => course.value?.deadline))
const currentGroup = computed(() => GROUPS.find((g) => g.key === group.value))
const recipientCount = computed(() => currentGroup.value?.count() ?? 0)
const channelLabels = computed(() => {
  const labels = []
  if (settings.channels.mail) labels.push('사내 메일')
  if (settings.channels.messenger) labels.push('사내 메신저')
  if (settings.channels.sms) labels.push('문자')
  return labels
})
const channelKey = computed(() => channelLabels.value.join(','))
const personalizationBasis = computed(() => [
  course.value?.targetRule ?? '과정 대상 기준',
  currentGroup.value?.label ?? '',
  group.value === 'RENEWAL' ? '최근 이수일 반영' : '올해 이수 이력 없음',
  dday.value,
  channelLabels.value.join(' · ') || '발송 채널 미선택',
])
const groupPeople = computed(() =>
  (targets.value?.people ?? []).filter((person) =>
    group.value === 'RENEWAL'
      ? Boolean(person.trainings[course.value?.typeKey]?.lastTraining)
      : !person.trainings[course.value?.typeKey]?.lastTraining,
  ),
)
const samplePeople = computed(() => groupPeople.value.slice(0, 6))

function selectCourse(row) {
  selectedCourseId.value = row.courseId
  group.value = 'NEW'
  draft.value = { subject: '', body: '' }
  sent.value = false
  steps.reset()
  steps.open(1)
}

async function generate() {
  if (!course.value) return
  loading.value = true
  try {
    draft.value = await draftNotice({
      course: course.value,
      group: group.value,
      tone: tone.value,
      recipientCount: recipientCount.value,
      dday: dday.value,
      channels: channelLabels.value,
    })
  } finally {
    loading.value = false
  }
  steps.runTo(3) // 문안 → 발송 설정
}

onMounted(async () => {
  if (!courses.items.length) await courses.fetchAll()
  if (!hr.summary) await hr.fetchSummary()
  selectedCourseId.value = hr.urgent?.courseId ?? courseChoices.value[0]?.courseId ?? null
  steps.open(1) // 대상 그룹 확정
})

/** 톤·그룹을 바꾸면 이미 만든 문안만 다시 쓴다 (처음부터 자동 생성하지는 않는다) */
watch([group, tone, channelKey], () => {
  if (steps.reached(2)) generate()
})

const firstPerson = computed(() => groupPeople.value[0] ?? null)
const firstTrainingDate = computed(
  () => firstPerson.value?.trainings[course.value?.typeKey]?.lastTraining ?? null,
)
const preview = computed(() => ({
  to: `인사팀 → ${firstPerson.value?.name ?? '대상자'}`,
  subject: draft.value.subject,
  body: draft.value.body
    .replaceAll('{이름}', firstPerson.value?.name ?? '')
    .replaceAll('{D-day}', dday.value)
    .replaceAll(
      '{최근이수일}',
      firstTrainingDate.value ? fmtMonthDay(firstTrainingDate.value) : '이전 이수일',
    ),
}))

function send() {
  // 발송 기록 → 감사 근거 (시연: localStorage)
  const log = JSON.parse(localStorage.getItem('notice_log') ?? '[]')
  log.push({
    at: new Date().toISOString(),
    courseId: course.value?.id,
    total: recipientCount.value,
    channels: { ...settings.channels },
    remind: settings.remind,
  })
  localStorage.setItem('notice_log', JSON.stringify(log))
  sent.value = true
}
</script>

<template>
  <PageHeader title="수강 안내 발송">
    <template #subtitle> 과정 선택 → 대상 상황 → AI 맞춤 문안 → 발송 설정 </template>
    <template #actions>
      <v-btn variant="outlined">테스트 발송</v-btn>
      <v-btn
        color="primary"
        :disabled="sent || !recipientCount || !steps.reached(3)"
        @click="send"
        >{{ sent ? '발송 완료' : `${recipientCount}명에게 발송` }}</v-btn
      >
    </template>
  </PageHeader>

  <div class="body">
    <section class="left">
      <div>
        <div class="t-label">00 — 안내할 과정 선택</div>
        <div class="course-select">
          <button
            v-for="item in courseChoices"
            :key="item.courseId"
            type="button"
            :class="{ active: item.courseId === selectedRow?.courseId }"
            @click="selectCourse(item)"
          >
            <span>
              <strong>{{ item.course.title }}</strong>
              <small>{{ fmtMonthDay(item.course.deadline) }} 마감</small>
            </span>
            <span class="course-select__meta">
              <b class="mono">{{ fmtDday(item.course.deadline, today()) }}</b>
              <span class="num">{{ item.notDoneCount }}명</span>
            </span>
          </button>
        </div>
      </div>

      <RevealGroup :ready="steps.reached(1)" :stagger="0.1" :delay="0">
        <RevealItem v-if="steps.reached(1)">
          <div class="selected-course">
            <span class="t-label">선택 과정</span>
            <b>{{ course?.title }}</b>
            <span class="t-small">
              전체 미이수 <strong class="num t-red">{{ total }}</strong
              >명 · {{ dday }}
            </span>
          </div>
          <div class="t-label" style="margin-top: 20px">
            01 — 대상 그룹 선택 · 그룹별로 문안이 다르게 생성됩니다
          </div>
          <ul class="groups">
            <li v-for="g in GROUPS" :key="g.key" :class="{ active: group === g.key }">
              <button type="button" @click="group = g.key">
                <span class="groups__label">{{ g.label }}</span>
                <span class="groups__right"
                  ><span class="t-small">{{ g.sub }}</span
                  ><span class="num">{{ g.count() }}<small>명</small></span></span
                >
              </button>
            </li>
          </ul>
          <div v-if="samplePeople.length" class="target-preview">
            <span class="t-label">발송 대상 예시</span>
            <span v-for="person in samplePeople" :key="person.userId" class="target-name">
              {{ person.name }}
            </span>
          </div>
        </RevealItem>

        <RevealItem v-if="steps.reached(2)">
          <NoticeDraftEditor
            v-model="draft"
            :group-label="currentGroup.label"
            :group-count="currentGroup.count()"
            :tone="tone"
            :loading="loading"
            :basis="personalizationBasis"
            style="margin-top: 24px"
            @update:tone="tone = $event"
            @regenerate="generate"
          />
        </RevealItem>
      </RevealGroup>

      <div v-if="!steps.reached(2)" class="draft-cta">
        <v-btn color="primary" :loading="loading" :disabled="!course" @click="generate"
          >대상별 맞춤 문안 생성</v-btn
        >
        <span class="t-small"
          >대상 사유·이수 이력·마감·발송 채널을 반영하며, 생성 후 직접 수정할 수 있습니다.</span
        >
      </div>

      <p v-if="steps.reached(3)" class="t-small" style="margin-top: auto; padding-top: 24px">
        발송 내용과 대상 명단은 조치 이력으로 자동 저장됩니다.
      </p>
    </section>

    <RevealGroup :ready="steps.reached(3)" :stagger="0.1" :delay="0">
      <RevealItem v-if="steps.reached(3)">
        <SendSettings v-model="settings" :preview="preview" :total="recipientCount" />
      </RevealItem>
    </RevealGroup>
  </div>
</template>

<style scoped>
.body {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 48px;
  flex-grow: 1;
}
.left {
  display: flex;
  flex-direction: column;
}
.course-select {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 10px;
}
.course-select button {
  min-width: 0;
  min-height: 58px;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-left: 2px solid transparent;
  background: #fff;
  color: var(--ink-600);
  font: inherit;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.course-select button:hover {
  border-color: var(--line-strong);
}
.course-select button.active {
  border-left-color: var(--sk-red);
  background: var(--sk-red-tint);
  color: var(--ink-900);
}
.course-select strong,
.course-select small {
  display: block;
}
.course-select strong {
  overflow: hidden;
  font-size: 12px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.course-select small {
  margin-top: 3px;
  color: var(--ink-400);
  font-size: 10px;
}
.course-select__meta {
  flex-shrink: 0;
  text-align: right;
  font-size: 11px;
}
.course-select__meta b,
.course-select__meta span {
  display: block;
}
.course-select button.active .course-select__meta b {
  color: var(--sk-red-text);
}
.selected-course {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-top: 20px;
  padding: 10px 12px;
  background: var(--surface-muted);
}
.selected-course b {
  font-size: 13px;
  font-weight: 600;
}
.selected-course .t-small {
  margin-left: auto;
}
.selected-course strong {
  font-weight: 600;
}
.groups {
  list-style: none;
  margin: 10px 0 0;
  padding: 0;
  border-top: 1px solid var(--line-strong);
}
.groups li {
  border-bottom: 1px solid var(--line);
  border-left: 2px solid transparent;
  margin-left: -2px;
}
.groups li.active {
  border-left-color: var(--sk-red);
}
.groups button {
  width: 100%;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0 0 14px;
  background: none;
  border: 0;
  font: inherit;
  font-size: 14px;
  color: var(--ink-600);
  cursor: pointer;
}
.groups li.active button {
  color: var(--ink-900);
  font-weight: 600;
}
.groups__right {
  display: flex;
  align-items: center;
  gap: 14px;
}
.groups__right .num {
  font-weight: 500;
}
.draft-cta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 24px;
}
.groups__right small {
  font-family: var(--font-sans);
  font-size: 12px;
  color: var(--ink-400);
  margin-left: 2px;
}
.target-preview {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}
.target-preview .t-label {
  margin-right: 4px;
}
.target-name {
  padding: 3px 7px;
  background: var(--surface-muted);
  border: 1px solid var(--line);
  font-size: 11px;
  color: var(--ink-600);
}
</style>
