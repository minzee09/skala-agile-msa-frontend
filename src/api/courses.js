import { http, unwrap } from './http'

/**
 * course-service. 법정교육 메타(법정 근거·주기·이수시간·마감·대상 조건)는 백엔드 스키마에 없어
 * description 에 JSON으로 실어 보낸다 — utils/courseMeta.js 가 인코딩/디코딩을 담당한다.
 */
export const coursesApi = {
  list: () => http.get('/api/courses').then(unwrap),
  getById: (id) => http.get(`/api/courses/${id}`).then(unwrap),
  listByCategory: (category) => http.get(`/api/courses/category/${category}`).then(unwrap),
  /** payload: { title, description, category, price } — INSTRUCTOR 전용 */
  create: (payload) => http.post('/api/courses', payload).then(unwrap),
}
