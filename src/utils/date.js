const MS_PER_DAY = 86_400_000

const toDate = (v) => (v instanceof Date ? v : new Date(v))

/** 'YYYY-MM-DD' → 'MM.DD' */
export const fmtMonthDay = (v) => {
  const d = toDate(v)
  return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

/** 'YYYY-MM-DD' → 'YYYY.MM.DD' */
export const fmtDate = (v) => {
  const d = toDate(v)
  return `${d.getFullYear()}.${fmtMonthDay(d)}`
}

/** 오늘 기준 D-day (양수 = 남은 일수). today 를 넘기면 시연용 고정 날짜로 계산 가능. */
export const daysUntil = (deadline, today = new Date()) => {
  const a = toDate(today)
  const b = toDate(deadline)
  const start = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())
  const end = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.round((end - start) / MS_PER_DAY)
}

export const fmtDday = (deadline, today) => {
  const n = daysUntil(deadline, today)
  if (n < 0) return `D+${Math.abs(n)}`
  return `D-${n}`
}

/** 연도 내 위치 0~1 (로드맵 x 좌표용) */
export const yearFraction = (v) => {
  const d = toDate(v)
  const start = new Date(d.getFullYear(), 0, 1)
  const end = new Date(d.getFullYear() + 1, 0, 1)
  return (d - start) / (end - start)
}

export const addYears = (v, years) => {
  const d = toDate(v)
  return new Date(d.getFullYear() + years, d.getMonth(), d.getDate())
}

export const addDays = (v, days) => {
  const d = toDate(v)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days)
}

/** 'YYYY-MM-DD' → 'YYYY년 M월 D일' (증서 본문용) */
export const fmtKoreanDate = (v) => {
  const d = toDate(v)
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
}

/** 'YYYY-MM-DDTHH:mm' → 'YYYY.MM.DD HH:mm' */
export const fmtDateTime = (v) => {
  const d = toDate(v)
  return `${fmtDate(d)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
