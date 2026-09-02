import { computed } from 'vue'
import { USE_MOCK } from '@/api/http'
import { daysUntil, fmtDday } from '@/utils/date'

/** 시연 모드에서는 디자인과 같은 기준일(2026-09-02)로 D-day 를 계산한다. */
export const today = () => (USE_MOCK ? new Date('2026-09-02T08:00:00') : new Date())

export function useDday(deadlineRef) {
  const days = computed(() => (deadlineRef.value ? daysUntil(deadlineRef.value, today()) : null))
  const label = computed(() => (deadlineRef.value ? fmtDday(deadlineRef.value, today()) : ''))
  const urgent = computed(() => days.value !== null && days.value <= 30)
  return { days, label, urgent }
}
