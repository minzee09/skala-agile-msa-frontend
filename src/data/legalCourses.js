import { JOBS, PRIVACY_HANDLING_JOBS } from './directory.js'

const ALL_JOBS = Object.keys(JOBS)

/**
 * 5종 법정의무교육 기준 정보. 과정 등록 시 교육 유형 선택지와 자동 채움의 기본값으로 쓴다.
 * 과태료는 법 조문상 상한 기준 — 발표 전 최신 시행령으로 검증 필요.
 */
export const LEGAL_COURSE_TYPES = [
  {
    key: 'PRIVACY',
    deadlineMonthDay: '09-14',
    defaultTargetJobs: PRIVACY_HANDLING_JOBS,
    name: '개인정보보호 및 정보보안 교육',
    shortName: '개인정보보호 교육',
    law: '개인정보보호법 제28조',
    lawShort: '제28조',
    cycle: '연 1회 이상',
    minutes: 60,
    targetRule: '업무상 개인정보를 처리하는 모든 자',
    category: 'SECURITY',
    penalty: {
      cap: 30_000_000,
      note: '교육 미실시 자체 과태료 없음 · 제29조 안전조치 위반 시 3,000만원 이하',
    },
  },
  {
    key: 'SAFETY',
    deadlineMonthDay: '10-31',
    defaultTargetJobs: ALL_JOBS,
    name: '산업안전보건교육',
    shortName: '산업안전보건교육',
    law: '산업안전보건법 제29조',
    lawShort: '제29조',
    cycle: '분기/반기 정기',
    minutes: 120,
    targetRule: '전 근로자',
    category: 'OTHER',
    penalty: { cap: 5_000_000, note: '제175조 · 1인당 10/20/50만원(1·2·3차)' },
  },
  {
    key: 'HARASSMENT',
    deadlineMonthDay: '11-30',
    defaultTargetJobs: ALL_JOBS,
    name: '직장 내 성희롱 예방교육',
    shortName: '성희롱 예방교육',
    law: '남녀고용평등법 제13조',
    lawShort: '제13조',
    cycle: '연 1회 이상',
    minutes: 60,
    targetRule: '전 임직원',
    category: 'OTHER',
    penalty: { cap: 5_000_000, note: '제39조' },
  },
  {
    key: 'DISABILITY',
    deadlineMonthDay: '11-30',
    defaultTargetJobs: ALL_JOBS,
    name: '직장 내 장애인 인식개선교육',
    shortName: '장애인 인식개선교육',
    law: '장애인고용촉진법 제5조의2',
    lawShort: '제5조의2',
    cycle: '연 1회 이상',
    minutes: 60,
    targetRule: '전 임직원',
    category: 'OTHER',
    penalty: { cap: 3_000_000, note: '제86조 · 교육 자료 3년 보관 의무' },
  },
  {
    key: 'PENSION',
    deadlineMonthDay: '12-31',
    defaultTargetJobs: ALL_JOBS,
    name: '퇴직연금교육',
    shortName: '퇴직연금교육',
    law: '근로자퇴직급여보장법 제32조',
    lawShort: '제32조',
    cycle: '연 1회 이상',
    minutes: 40,
    targetRule: '퇴직연금제도 가입 근로자',
    category: 'OTHER',
    penalty: { cap: 10_000_000, note: '제48조' },
  },
]

export const findCourseType = (key) => LEGAL_COURSE_TYPES.find((t) => t.key === key)

/** 증빙 보존 기간(년) — 5종 공통으로 3년 */
export const EVIDENCE_RETENTION_YEARS = 3

/** 과정명·법령 문구로 유형을 되찾는다 (백엔드가 메타 없이 만든 과정 대비) */
export const matchCourseType = (title = '', law = '') => {
  const t = `${title}${law}`.replace(/s/g, '')
  return (
    LEGAL_COURSE_TYPES.find((c) => law && t.includes(c.law.replace(/s/g, ''))) ??
    LEGAL_COURSE_TYPES.find((c) => t.includes(c.name.replace(/s/g, ''))) ??
    LEGAL_COURSE_TYPES.find((c) => t.includes(c.shortName.replace(/s/g, ''))) ??
    null
  )
}

/** 해당 연도의 기본 이수 마감일 */
export const defaultDeadline = (type, year = new Date().getFullYear()) =>
  type?.deadlineMonthDay ? `${year}-${type.deadlineMonthDay}` : null
