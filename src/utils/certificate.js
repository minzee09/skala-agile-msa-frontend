import { EVIDENCE_RETENTION_YEARS } from '@/data/legalCourses'
import { addDays, addYears } from '@/utils/date'

/**
 * 이수증 파생값. 백엔드 Enrollment 에는 이수증 개념이 없어(상태 PENDING/ACTIVE 뿐),
 * 발급번호·유효기간·보존기한을 이수일 기준으로 여기서 결정론적으로 계산한다.
 * Sprint2에서 certificate 테이블이 생기면 이 파일만 API 호출로 바꾼다.
 */

const pad = (n, len) => String(n).padStart(len, '0')

/** 발급번호 — 같은 이수 기록이면 항상 같은 번호가 나온다. */
export const certNo = ({ course, userId, completedAt }) =>
  `SK-LT-${new Date(completedAt).getFullYear()}-${pad(course.id, 2)}${pad(userId, 3)}`

/** 유효기간 — 갱신주기가 '연 N회'면 이수일 + 1년 − 1일 */
export const validUntil = (completedAt) => addDays(addYears(completedAt, 1), -1)

/** 증빙 보존기한 — 5종 공통 3년 */
export const retentionUntil = (completedAt) => addYears(completedAt, EVIDENCE_RETENTION_YEARS)

/** 화면에 필요한 값들을 한 번에 붙인 이수증 객체 */
export const toCertificate = ({ course, profile }) => ({
  course,
  no: certNo({ course, userId: profile.id, completedAt: course.completedAt }),
  completedAt: course.completedAt,
  validUntil: validUntil(course.completedAt),
  retentionUntil: retentionUntil(course.completedAt),
  holder: {
    name: profile.name,
    employeeNo: profile.employeeNo ?? '-',
    dept: profile.dept,
    job: profile.job,
  },
})
