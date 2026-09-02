import { http } from './http'

/** recommend-service(FastAPI) — 수강 이력 기반 강의 추천. 현재 MVP에서는 참고용. */
export const recommendApi = {
  forUser: (userId) => http.get(`/api/recommend/${userId}`).then((res) => res.data),
}
