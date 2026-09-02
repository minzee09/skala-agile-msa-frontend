<script setup>
import { computed, onMounted, ref } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import RevealGroup from '@/components/common/RevealGroup.vue'
import RevealItem from '@/components/common/RevealItem.vue'
import SkeletonBlock from '@/components/common/SkeletonBlock.vue'
import DeadlineHero from '@/components/employee/DeadlineHero.vue'
import ProgressSegments from '@/components/employee/ProgressSegments.vue'
import YearRoadmap from '@/components/employee/YearRoadmap.vue'
import MyCourseTile from '@/components/employee/MyCourseTile.vue'
import EnrollConfirmDialog from '@/components/employee/EnrollConfirmDialog.vue'
import { useAuthStore } from '@/stores/auth'
import { useCoursesStore } from '@/stores/courses'
import { useEnrollmentsStore } from '@/stores/enrollments'
import { today } from '@/composables/useDday'
import { daysUntil, fmtDate, fmtDday } from '@/utils/date'

const auth = useAuthStore()
const courses = useCoursesStore()
const enrollments = useEnrollmentsStore()

const dialog = ref(false)
const selected = ref(null)
/** 과정 목록과 내 수강 이력이 모두 도착한 뒤에 화면을 순서대로 채운다 */
const ready = ref(false)

onMounted(async () => {
  if (!courses.items.length) await courses.fetchAll()
  await enrollments.fetchMine()
  ready.value = true
})

/** D-day·임박 여부를 붙인 내 과정 목록 */
const myCourses = computed(() =>
  enrollments.myCourses.map((c) => {
    const days = c.deadline ? daysUntil(c.deadline, today()) : null
    return {
      ...c,
      days,
      urgent: days !== null && days <= 30,
      canDemoReset: enrollments.canDemoReset(c.id),
    }
  }),
)
const next = computed(() => myCourses.value.find((c) => c.status === 'NOT_DONE') ?? null)

function openEnroll(course) {
  selected.value = course
  dialog.value = true
}
const enroll = (course) => enrollments.enroll(course.id)
</script>

<template>
  <PageHeader :title="`안녕하세요, ${auth.profile?.name}님`">
    <template #subtitle>{{ today().getFullYear() }}년 법정의무교육</template>
    <template #actions
      ><span class="mono t-small">{{ fmtDate(today()) }}</span></template
    >
  </PageHeader>

  <RevealGroup v-if="ready && myCourses.length" :ready="ready" :stagger="0.11" :delay="0.05">
    <RevealItem v-if="next">
      <DeadlineHero
        :course="next"
        :days="next.days"
        @enroll="openEnroll(next)"
        @detail="$router.push({ name: 'me-courses' })"
      />
    </RevealItem>

    <RevealItem :style="{ marginTop: next ? '-16px' : null }">
      <ProgressSegments :courses="myCourses" :done-minutes="enrollments.doneMinutes" />
    </RevealItem>

    <RevealItem>
      <YearRoadmap :courses="myCourses" />
    </RevealItem>

    <RevealItem>
      <div class="list__head">
        <h2 class="t-h2" style="margin: 0">내 대상 교육</h2>
        <span class="t-small"
          >전체 {{ myCourses.length }} · 미이수
          <b class="t-red">{{ enrollments.notDoneCount }}</b> · 이수 완료
          {{ enrollments.doneCount }}</span
        >
      </div>
      <div class="tiles">
        <RevealGroup :ready="ready" :stagger="0.06" :delay="0.1">
          <RevealItem v-for="(c, i) in myCourses" :key="c.id" :rise="10">
            <MyCourseTile
              :course="c"
              :index="i"
              @enroll="openEnroll"
              @reset-demo="(course) => enrollments.resetDemoEnrollment(course.id)"
            />
          </RevealItem>
        </RevealGroup>
      </div>
    </RevealItem>
  </RevealGroup>

  <!-- 대기 상태: 들어올 자리를 그대로 잡아 둔다 -->
  <div v-else class="loading">
    <div class="loading__hero">
      <SkeletonBlock :height="12" width="220px" />
      <SkeletonBlock :height="46" width="300px" style="margin-top: 12px" :delay="0.1" />
    </div>
    <SkeletonBlock :height="8" width="100%" :delay="0.2" />
    <div class="loading__tiles">
      <SkeletonBlock v-for="i in 5" :key="i" :height="150" :delay="0.1 * i" />
    </div>
  </div>

  <EnrollConfirmDialog
    v-model="dialog"
    :course="selected"
    :dday="selected?.deadline ? fmtDday(selected.deadline, today()) : ''"
    :on-confirm="enroll"
  />
</template>

<style scoped>
.list__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}
.tiles {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 16px;
  margin-top: 16px;
}
.loading {
  display: flex;
  flex-direction: column;
  gap: var(--section-gap);
}
.loading__hero {
  background: var(--sk-red-tint);
  padding: 16px 20px;
}
.loading__tiles {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 16px;
}
</style>
