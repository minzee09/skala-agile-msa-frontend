import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { coursesApi } from '@/api/courses'
import { USE_MOCK } from '@/api/http'
import { toCreateRequest, toLegalCourse } from '@/utils/courseMeta'
import { daysUntil } from '@/utils/date'

export const useCoursesStore = defineStore('courses', () => {
  const items = ref([])
  const loading = ref(false)
  const error = ref(null)

  const byId = computed(() => new Map(items.value.map((c) => [c.id, c])))
  /** 마감 임박순 */
  const sortedByDeadline = computed(() =>
    [...items.value].sort(
      (a, b) => daysUntil(a.deadline ?? '2999-12-31') - daysUntil(b.deadline ?? '2999-12-31'),
    ),
  )

  async function fetchAll() {
    loading.value = true
    error.value = null
    try {
      const raw = USE_MOCK ? (await import('@/mocks')).mockCourses : await coursesApi.list()
      items.value = raw.map(toLegalCourse)
    } catch (e) {
      error.value = e
    } finally {
      loading.value = false
    }
  }

  async function create(form) {
    const created = USE_MOCK
      ? { id: Date.now(), ...toCreateRequest(form), enrollmentCount: 0 }
      : await coursesApi.create(toCreateRequest(form))
    const course = toLegalCourse(created)
    items.value.push(course)
    return course
  }

  return { items, loading, error, byId, sortedByDeadline, fetchAll, create }
})
