import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { interpretTargetRule } from '@/api/llm'
import { deptLabel, jobLabel } from '@/data/directory'
import { POPULATION, realFirst } from '@/data/population'
import { today } from '@/composables/useDday'
import { daysUntil } from '@/utils/date'
import { useCoursesStore } from './courses'

/**
 * AI 대상자 선별: 문장 → 조회 조건 → 결과.
 *
 * 결과는 조건에 따라 두 가지 형태로 나온다.
 *   PEOPLE        — 조건에 맞는 임직원 명단
 *   DEPT_RANKING  — 부서별 이수율 순위
 * 어떤 조건이든 프론트 인원 명부(POPULATION)에서 실제로 계산하므로
 * 질의가 달라지면 결과도 달라진다.
 */
export const RESULT = { PEOPLE: 'PEOPLE', DEPT_RANKING: 'DEPT_RANKING' }

export const useScreeningStore = defineStore('screening', () => {
  const query = ref('')
  const interpretation = ref(null)
  const result = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const courses = useCoursesStore()

  const targetCourse = computed(() =>
    interpretation.value?.courseTypeKey
      ? (courses.items.find((c) => c.typeKey === interpretation.value.courseTypeKey) ?? null)
      : null,
  )
  const jobLabels = computed(() => (interpretation.value?.jobs ?? []).map(jobLabel))

  /** 부서·직무명이 반영된 전체 대상자 행 */
  const allPeopleRows = computed(() =>
    (result.value?.people ?? []).map((p) => ({
      ...p,
      dept: deptLabel(p.dept),
      job: jobLabel(p.job),
    })),
  )
  /** 대화 본문에는 앞 8명만 미리 보여준다. */
  const peopleRows = computed(() => allPeopleRows.value.slice(0, 8))

  async function run(text) {
    loading.value = true
    error.value = null
    query.value = text
    interpretation.value = null
    result.value = null
    try {
      const parsed = await interpretTargetRule(text)
      interpretation.value = { ...parsed, savedAt: new Date().toISOString() }
      persist()
      result.value = build(parsed)
    } catch (e) {
      error.value = e
    } finally {
      loading.value = false
    }
  }

  /** 조건 → 결과. 두 형태 모두 여기서 계산한다. */
  function build(parsed) {
    if (parsed.resultType === RESULT.DEPT_RANKING) return buildDeptRanking(parsed)
    return buildPeople(parsed)
  }

  /** 마감이 N일 이내인 과정들의 유형 키 */
  function typesByDeadline(days) {
    return courses.items
      .filter((c) => c.deadline && daysUntil(c.deadline, today()) <= days)
      .map((c) => c.typeKey)
      .filter(Boolean)
  }

  function buildPeople(parsed) {
    const deadlineTypes = parsed.deadlineWithinDays
      ? typesByDeadline(parsed.deadlineWithinDays)
      : null
    const typeKeys = deadlineTypes?.length
      ? deadlineTypes
      : parsed.courseTypeKey
        ? [parsed.courseTypeKey]
        : courses.items.map((c) => c.typeKey).filter(Boolean)

    const wanted = parsed.status === 'COMPLETED' ? 'DONE' : (parsed.status ?? 'NOT_COMPLETED')

    /**
     * 조회 범위는 과정이 정한 대상 조건이 우선한다.
     * AI가 직무를 좁게 잡아도(예: 퇴직연금교육을 개인정보 취급 직무로 한정) 과정의 대상 기준을 따른다.
     * 과정을 특정하지 못한 질의에서만 AI가 뽑은 직무를 그대로 쓴다.
     */
    const courseJobs = typeKeys.flatMap(
      (key) => courses.items.find((c) => c.typeKey === key)?.targetJobs ?? [],
    )
    const scopeJobs = typeKeys.length === 1 && courseJobs.length ? courseJobs : (parsed.jobs ?? [])

    const matched = []
    for (const p of POPULATION) {
      if (scopeJobs.length && !scopeJobs.includes(p.job)) continue
      if (parsed.hireYear && !p.hireDate.startsWith(String(parsed.hireYear))) continue

      const hit = typeKeys.find((key) => {
        const t = p.trainings[key]
        if (!t) return false
        if (wanted === 'DONE') return t.status === 'DONE'
        if (wanted === 'IN_PROGRESS') return t.status === 'IN_PROGRESS'
        return t.status === 'NOT_DONE'
      })
      if (!hit) continue

      matched.push({
        userId: p.userId,
        name: p.name,
        real: p.real,
        employeeNo: p.employeeNo,
        dept: p.dept,
        job: p.job,
        hireDate: p.hireDate,
        courseTypeKey: hit,
        lastTraining: p.trainings[hit]?.lastTraining ?? null,
      })
    }

    const byDept = Object.entries(
      matched.reduce((acc, p) => ((acc[p.dept] = (acc[p.dept] ?? 0) + 1), acc), {}),
    )
      .map(([dept, count]) => ({ dept, count }))
      .sort((a, b) => b.count - a.count)

    return {
      type: RESULT.PEOPLE,
      total: matched.length,
      byDept,
      history: {
        none: matched.filter((p) => !p.lastTraining).length,
        expired: matched.filter((p) => p.lastTraining).length,
      },
      courseTypeKeys: [...new Set(matched.map((p) => p.courseTypeKey))],
      people: realFirst(matched),
    }
  }

  function buildDeptRanking(parsed) {
    const limit = parsed.limit ?? 3
    const keys = courses.items.map((c) => ({ key: c.typeKey, jobs: c.targetJobs ?? [] }))

    const byDept = new Map()
    for (const p of POPULATION) {
      const row = byDept.get(p.dept) ?? { dept: p.dept, targets: 0, done: 0, notDone: 0, head: 0 }
      row.head += 1
      for (const c of keys) {
        if (!c.key) continue
        if (c.jobs.length && !c.jobs.includes(p.job)) continue
        row.targets += 1
        if (p.trainings[c.key]?.status === 'DONE') row.done += 1
        else if (p.trainings[c.key]?.status === 'NOT_DONE') row.notDone += 1
      }
      byDept.set(p.dept, row)
    }

    const rows = [...byDept.values()]
      .map((r) => ({ ...r, rate: r.targets ? Math.round((r.done / r.targets) * 1000) / 10 : 0 }))
      .sort((a, b) => a.rate - b.rate)

    return {
      type: RESULT.DEPT_RANKING,
      total: rows.slice(0, limit).reduce((sum, r) => sum + r.notDone, 0),
      rows: rows.slice(0, limit),
      allRows: rows,
      limit,
    }
  }

  /** 해석 조건은 감사 근거로 남긴다 */
  function persist() {
    const log = JSON.parse(localStorage.getItem('screening_history') ?? '[]')
    log.push({ query: query.value, interpretation: interpretation.value })
    localStorage.setItem('screening_history', JSON.stringify(log.slice(-20)))
  }

  function reset() {
    query.value = ''
    interpretation.value = null
    result.value = null
    error.value = null
  }

  return {
    query,
    interpretation,
    result,
    loading,
    error,
    targetCourse,
    jobLabels,
    allPeopleRows,
    peopleRows,
    run,
    reset,
  }
})
