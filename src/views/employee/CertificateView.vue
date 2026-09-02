<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { motion } from 'motion-v'
import PageHeader from '@/components/common/PageHeader.vue'
import RevealGroup from '@/components/common/RevealGroup.vue'
import RevealItem from '@/components/common/RevealItem.vue'
import SkeletonBlock from '@/components/common/SkeletonBlock.vue'
import HairlineTile from '@/components/common/HairlineTile.vue'
import CertificatePaper from '@/components/employee/CertificatePaper.vue'
import CertificatePicker from '@/components/employee/CertificatePicker.vue'
import { useAuthStore } from '@/stores/auth'
import { useCoursesStore } from '@/stores/courses'
import { useEnrollmentsStore } from '@/stores/enrollments'
import { today } from '@/composables/useDday'
import { daysUntil, fmtDate, fmtDateTime } from '@/utils/date'
import { toCertificate } from '@/utils/certificate'

/**
 * 이수증 — 이수 완료한 과정의 증서를 보고, 인쇄·PDF 로 내보낸다.
 * 발급번호·유효기간은 이수일에서 계산한다(백엔드에 이수증 엔티티 없음).
 */
const auth = useAuthStore()
const courses = useCoursesStore()
const enrollments = useEnrollmentsStore()
const route = useRoute()

const selectedId = ref(null)
const issueLog = ref(JSON.parse(localStorage.getItem('cert_issue_log') ?? '[]'))
const mailed = ref(false)
const ready = ref(false)

onMounted(async () => {
  if (!courses.items.length) await courses.fetchAll()
  if (!enrollments.mine.length) await enrollments.fetchMine()
  ready.value = true
})

const done = computed(() => enrollments.myCourses.filter((c) => c.status === 'DONE'))

watch(
  done,
  (list) => {
    if (!list.length) return
    const wanted = Number(route.query.course)
    const match = list.find((c) => c.id === wanted)
    if (!selectedId.value || !list.some((c) => c.id === selectedId.value)) {
      selectedId.value = (match ?? list[0]).id
    }
  },
  { immediate: true },
)
watch(selectedId, () => (mailed.value = false))

const cert = computed(() => {
  const course = done.value.find((c) => c.id === selectedId.value)
  if (!course || !auth.profile) return null
  return toCertificate({ course, profile: auth.profile })
})

const validDays = computed(() => (cert.value ? daysUntil(cert.value.validUntil, today()) : 0))
const nextYear = computed(() =>
  cert.value ? new Date(cert.value.validUntil).getFullYear() : today().getFullYear(),
)

const facts = computed(() =>
  cert.value
    ? [
        { k: '발급번호', v: cert.value.no, mono: true },
        { k: '이수일', v: fmtDate(cert.value.completedAt), mono: true },
        { k: '교육시간', v: `${cert.value.course.minutes}분`, num: true },
        { k: '증빙 보존', v: `${fmtDate(cert.value.retentionUntil)}까지`, mono: true },
      ]
    : [],
)

const myLog = computed(() => issueLog.value.filter((l) => l.no === cert.value?.no).slice(-3))

function printDoc() {
  record('인쇄 · PDF')
  window.print()
}

function mail() {
  record('이메일')
  mailed.value = true
}

function record(kind) {
  if (!cert.value) return
  issueLog.value = [
    ...issueLog.value,
    { at: new Date().toISOString(), no: cert.value.no, kind },
  ].slice(-40)
  localStorage.setItem('cert_issue_log', JSON.stringify(issueLog.value))
}
</script>

<template>
  <PageHeader title="이수증">
    <template #subtitle>
      이수 완료 <span class="num">{{ done.length }}</span
      >건 · 발급 즉시 · 재발급 제한 없음
    </template>
    <template #actions>
      <v-btn variant="outlined" :disabled="!cert || mailed" @click="mail">{{
        mailed ? '메일 발송됨' : '이메일로 받기'
      }}</v-btn>
      <v-btn color="primary" :disabled="!cert" @click="printDoc">인쇄 · PDF 저장</v-btn>
    </template>
  </PageHeader>

  <RevealGroup v-if="ready && done.length" :ready="ready" :stagger="0.12" :delay="0.05">
    <RevealItem>
      <CertificatePicker v-model="selectedId" :courses="done" class="no-print" />
    </RevealItem>

    <RevealItem v-if="cert" class="body">
      <CertificatePaper :key="cert.no" :cert="cert" :issued-on="today()" />

      <aside class="side no-print">
        <HairlineTile accent="teal" class="valid">
          <div class="t-label">유효기간</div>
          <div class="valid__line">
            <span class="num valid__days">{{ validDays }}</span>
            <span class="valid__unit">일 남음</span>
          </div>
          <div class="t-small" style="margin-top: 6px; color: var(--ink-600)">
            <span class="mono">{{ fmtDate(cert.validUntil) }}</span
            >까지 유효 · {{ cert.course.cycle }}이므로
            <b style="color: var(--ink-900)">{{ nextYear }}년</b>에 다시 이수해야 합니다.
          </div>
        </HairlineTile>

        <section>
          <div class="t-label">발급 정보</div>
          <dl class="facts">
            <template v-for="f in facts" :key="f.k">
              <dt>{{ f.k }}</dt>
              <dd :class="{ mono: f.mono, num: f.num }">{{ f.v }}</dd>
            </template>
          </dl>
        </section>

        <section v-if="myLog.length">
          <div class="t-label">발급 이력</div>
          <ul class="log">
            <motion.li
              v-for="(l, i) in myLog"
              :key="l.at"
              :initial="{ opacity: 0, x: -6 }"
              :animate="{ opacity: 1, x: 0 }"
              :transition="{ delay: 0.05 * i, duration: 0.3 }"
            >
              <span class="mono t-small">{{ fmtDateTime(l.at) }}</span>
              <span class="t-small">{{ l.kind }}</span>
            </motion.li>
          </ul>
        </section>

        <p class="t-small note">
          이수증은 학습 로그와 같은 기록에서 생성되며, 회사가 보관하는 증빙과 내용이 일치합니다.
        </p>

        <RouterLink
          v-if="enrollments.notDoneCount"
          :to="{ name: 'me-courses' }"
          class="t-small remain"
        >
          아직 이수하지 않은 교육 <b class="t-red">{{ enrollments.notDoneCount }}건</b> 보기 →
        </RouterLink>
      </aside>
    </RevealItem>
  </RevealGroup>

  <div v-else-if="!ready" class="loading">
    <SkeletonBlock :height="52" width="100%" />
    <div class="loading__body">
      <SkeletonBlock :height="420" />
      <SkeletonBlock :height="180" :delay="0.15" />
    </div>
  </div>

  <div v-else class="empty">
    <div class="t-h2">아직 발급할 이수증이 없습니다</div>
    <p class="t-small" style="margin: 10px 0 20px">
      교육을 이수하면 이수증이 자동으로 발급됩니다. 별도 신청은 필요하지 않습니다.
    </p>
    <v-btn color="primary" :to="{ name: 'me-courses' }">교육 과정 보기</v-btn>
  </div>
</template>

<style scoped>
.body {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 48px;
  align-items: start;
}
.side {
  display: flex;
  flex-direction: column;
  gap: 28px;
}
.valid {
  padding: 16px 18px;
}
.valid__line {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-top: 6px;
}
.valid__days {
  font-size: 40px;
  font-weight: 500;
  letter-spacing: -0.04em;
  line-height: 1;
  color: var(--sk-teal);
}
.valid__unit {
  font-size: 15px;
  font-weight: 500;
}
.facts {
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr);
  margin: 10px 0 0;
  border-top: 1px solid var(--line-strong);
}
.facts dt,
.facts dd {
  margin: 0;
  padding: 9px 0;
  border-bottom: 1px solid var(--line);
  font-size: 13px;
}
.facts dt {
  color: var(--ink-400);
  font-size: 12px;
}
.log {
  list-style: none;
  margin: 10px 0 0;
  padding: 0;
}
.log li {
  display: flex;
  justify-content: space-between;
  height: 30px;
  align-items: center;
  border-bottom: 1px solid var(--line);
}
.note {
  line-height: 1.65;
  margin: 0;
}
.remain {
  border: 0;
  color: var(--ink-600);
}
.empty {
  margin-top: 40px;
  max-width: 380px;
}
.loading {
  display: flex;
  flex-direction: column;
  gap: var(--section-gap);
}
.loading__body {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 48px;
  align-items: start;
}
@media print {
  .body {
    display: block;
  }
}
</style>
