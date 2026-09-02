import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

/**
 * 게이트웨이(:8080)로 나가는 단일 axios 인스턴스.
 * baseURL은 비워두고 Vite 프록시(/api → 8080)를 탄다. 토큰은 요청 인터셉터에서 붙인다.
 */
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

http.interceptors.request.use((config) => {
  const auth = useAuthStore()
  if (auth.accessToken) {
    config.headers.Authorization = `Bearer ${auth.accessToken}`
  }
  return config
})

http.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore().logout()
    }
    return Promise.reject(err)
  },
)

/** 백엔드 공통 응답 { success, message, data } 에서 data만 꺼낸다. */
export const unwrap = (res) => res?.data?.data ?? res?.data

/** 백엔드가 없을 때(시연·개발) 목 데이터로 동작시킬지. */
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
