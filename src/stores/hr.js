import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { deptLabel, jobLabel } from '@/data/directory'
import { POPULATION, courseStats, headcountStats, realFirst } from '@/data/population'
import { useCoursesStore } from './courses'

/**
 * HR 전사 집계.
 *
 * 백엔드에는 사용자 목록 API도, 부서·직무도 없다. 그래서 전사 단위 수치는
 * 목/실서버 모드와 무관하게 프론트 인원 명부(POPULATION)에서 계산한다.
 * 개인 화면(내 수강 이력)만 백엔드를 그대로 쓴다.
 */
export const useHrStore = defineStore('hr', () => {
  const summary = ref(null)
  const loading = ref(false)

  const courses = useCoursesStore()

  /** 과정별 카드 데이터: 과정 메타 + 이수/진행/미이수 % */
  const courseRows = computed(() =>
    (summary.value?.courses ?? []).map((row) => ({
      ...row,
      course: courses.byId.get(row.courseId) ?? null,
      notDoneCount: row.notDoneCount,
    })),
  )

  const completionRate = computed(() =>
    summary.value ? (summary.value.completedAll / summary.value.headcount) * 100 : 0,
  )

  /** 가장 급한 과정 (마감이 가깝고 미이수가 있는) */
  const urgent = computed(
    () =>
      courseRows.value
        .filter((r) => r.course?.deadline && r.notDone > 0)
        .sort((a, b) => a.course.deadline.localeCompare(b.course.deadline))[0] ?? null,
  )

  function rawPeopleForCourse(course, status = 'NOT_DONE') {
    if (!course?.typeKey) return []
    const list = POPULATION.filter((p) => {
      if (course.targetJobs?.length && !course.targetJobs.includes(p.job)) return false
      return p.trainings[course.typeKey]?.status === status
    })
    return realFirst(list)
  }

  function peopleForCourse(course, status = 'NOT_DONE') {
    return rawPeopleForCourse(course, status).map((p) => ({
      userId: p.userId,
      name: p.name,
      employeeNo: p.employeeNo,
      dept: deptLabel(p.dept),
      job: jobLabel(p.job),
      lastTraining: p.trainings[course.typeKey]?.lastTraining ?? null,
    }))
  }

  function targetsForCourse(course) {
    if (!course?.typeKey) return null
    const people = rawPeopleForCourse(course)
    return {
      course,
      total: people.length,
      none: people.filter((p) => !p.trainings[course.typeKey]?.lastTraining).length,
      expired: people.filter((p) => p.trainings[course.typeKey]?.lastTraining).length,
      first: people[0] ?? null,
      people,
    }
  }

  /** 기본값은 가장 임박한 과정이지만 화면에서 다른 과정을 선택할 수 있다. */
  const imminentPeople = computed(() => peopleForCourse(urgent.value?.course))

  /** 가장 급한 과정의 미이수 대상 — 안내 발송 화면이 쓴다 */
  const urgentTargets = computed(() => targetsForCourse(urgent.value?.course))

  async function fetchSummary() {
    loading.value = true
    try {
      const perCourse = courses.items.map((c) => {
        const s = courseStats(c.typeKey, c.targetJobs)
        const pct = (n) => (s.targets ? Math.round((n / s.targets) * 100) : 0)
        return {
          courseId: c.id,
          targets: s.targets,
          done: pct(s.done),
          inProgress: pct(s.inProgress),
          notDone: pct(s.notDone),
          doneCount: s.done,
          inProgressCount: s.inProgress,
          notDoneCount: s.notDone,
        }
      })
      summary.value = {
        asOf: new Date().toISOString(),
        ...headcountStats(),
        courses: perCourse,
      }
    } finally {
      loading.value = false
    }
  }

  return {
    summary,
    loading,
    courseRows,
    completionRate,
    urgent,
    imminentPeople,
    urgentTargets,
    peopleForCourse,
    targetsForCourse,
    fetchSummary,
  }
})
