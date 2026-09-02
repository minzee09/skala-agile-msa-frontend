import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { enrollmentsApi } from '@/api/enrollments'
import { USE_MOCK } from '@/api/http'
import { useCoursesStore } from './courses'

/**
 * 백엔드 Enrollment.Status 는 PENDING / ACTIVE 두 가지뿐이다(COMPLETED 없음).
 * 시연 규칙: ACTIVE(결제 완료·수강 활성) = 이수 완료, PENDING = 진행 중. Sprint2에서 COMPLETED 추가 시 여기만 바꾼다.
 */
export const STATUS = { DONE: 'DONE', IN_PROGRESS: 'IN_PROGRESS', NOT_DONE: 'NOT_DONE' }

const toStatus = (enrollment) => {
  if (!enrollment) return STATUS.NOT_DONE
  return enrollment.status === 'ACTIVE' ? STATUS.DONE : STATUS.IN_PROGRESS
}

export const useEnrollmentsStore = defineStore('enrollments', () => {
  const mine = ref([])
  const loading = ref(false)
  /** 서버 취소 API가 없는 동안, 이번 세션에서 신청한 항목만 반복 시연할 수 있게 보관한다. */
  const demoEnrolledCourseIds = ref(new Set())
  const demoResetEnrollments = ref(new Map())

  const byCourseId = computed(() => new Map(mine.value.map((e) => [e.courseId, e])))

  /** 내 대상 과정에 이수 상태를 붙인 목록 */
  const myCourses = computed(() => {
    const courses = useCoursesStore()
    return courses.sortedByDeadline.map((c) => {
      const e = byCourseId.value.get(c.id)
      return {
        ...c,
        enrollment: e ?? null,
        status: toStatus(e),
        completedAt: e?.status === 'ACTIVE' ? e.createdAt : null,
      }
    })
  })

  const doneCount = computed(() => myCourses.value.filter((c) => c.status === STATUS.DONE).length)
  const notDoneCount = computed(
    () => myCourses.value.filter((c) => c.status === STATUS.NOT_DONE).length,
  )
  const doneMinutes = computed(() =>
    myCourses.value
      .filter((c) => c.status === STATUS.DONE)
      .reduce((sum, c) => sum + (c.minutes ?? 0), 0),
  )
  const nextDeadline = computed(() => myCourses.value.find((c) => c.status !== STATUS.DONE) ?? null)

  async function fetchMine() {
    loading.value = true
    try {
      const fetched = USE_MOCK
        ? (await import('@/mocks')).mockMyEnrollments
        : await enrollmentsApi.mine()
      const courses = useCoursesStore()
      const enrolledCourseIds = new Set(fetched.map((item) => item.courseId))
      const hasEnrollmentSlot = courses.items.some((course) => !enrolledCourseIds.has(course.id))

      // 백엔드에 전 과정 이력이 있어도 시연에서는 한 과정을 프런트에서만 신청 가능하게 연다.
      if (!hasEnrollmentSlot && courses.items.length && !demoResetEnrollments.value.size) {
        const candidate =
          courses.items.find((course) => course.typeKey === 'PRIVACY') ??
          courses.sortedByDeadline[0]
        const enrollment = fetched.find((item) => item.courseId === candidate?.id)
        if (candidate && enrollment) {
          demoResetEnrollments.value.set(candidate.id, { ...enrollment, status: 'PENDING' })
        }
      }

      mine.value = fetched.filter((item) => !demoResetEnrollments.value.has(item.courseId))
    } finally {
      loading.value = false
    }
  }

  /** 수강신청 → 백엔드가 결제(내부)·Kafka 로 ACTIVE 전환. 응답은 PENDING 일 수 있다. */
  async function enroll(courseId) {
    const resetEnrollment = demoResetEnrollments.value.get(courseId)
    const created = resetEnrollment
      ? resetEnrollment
      : USE_MOCK
        ? { id: Date.now(), courseId, status: 'PENDING', createdAt: new Date().toISOString() }
        : await enrollmentsApi.enroll(courseId)
    // 일부 백엔드는 생성 응답에서 courseId를 생략한다. 화면 상태 갱신에 필요한 값은 보완한다.
    const enrollment = { ...created, courseId: created.courseId ?? courseId }
    const existingIndex = mine.value.findIndex((item) => item.courseId === courseId)
    if (existingIndex === -1) mine.value.push(enrollment)
    else mine.value.splice(existingIndex, 1, enrollment)
    demoResetEnrollments.value.delete(courseId)
    demoEnrolledCourseIds.value.add(courseId)
    return enrollment
  }

  function canDemoReset(courseId) {
    return demoEnrolledCourseIds.value.has(courseId)
  }

  function resetDemoEnrollment(courseId) {
    if (!canDemoReset(courseId)) return
    const enrollment = mine.value.find((item) => item.courseId === courseId)
    if (!enrollment) return
    demoResetEnrollments.value.set(courseId, enrollment)
    mine.value = mine.value.filter((item) => item.courseId !== courseId)
  }

  return {
    mine,
    loading,
    myCourses,
    doneCount,
    notDoneCount,
    doneMinutes,
    nextDeadline,
    fetchMine,
    enroll,
    canDemoReset,
    resetDemoEnrollment,
  }
})
