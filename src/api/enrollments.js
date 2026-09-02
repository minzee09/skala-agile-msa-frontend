import { http, unwrap } from './http'

export const enrollmentsApi = {
  /** 내 수강 목록 (토큰 기준) */
  mine: () => http.get('/api/enrollments/my').then(unwrap),
  /** 특정 사용자의 수강 목록 — HR 전사 집계에 사용 */
  byUser: (userId) => http.get(`/api/enrollments/user/${userId}`).then(unwrap),
  /** 수강신청 → enrollment-service 가 payment(내부) 호출 → Kafka → ACTIVE */
  enroll: (courseId) => http.post('/api/enrollments', { courseId }).then(unwrap),
}
