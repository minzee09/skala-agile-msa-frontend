import axios from 'axios'
import { http, unwrap } from './http'

const AUTH_BASE = import.meta.env.VITE_AUTH_SERVER_URL ?? ''

export const usersApi = {
  /** 회원가입 — role: 'INSTRUCTOR'(HR) | 'STUDENT'(임직원) */
  register: (payload) => http.post('/api/users/register', payload).then(unwrap),

  /** 내 정보 */
  me: () => http.get('/api/users/me').then(unwrap),

  /** 특정 사용자 (HR 집계용) */
  getById: (id) => http.get(`/api/users/${id}`).then(unwrap),

  /** OAuth2 Authorization Code → Access Token (auth-server, client_secret_basic) */
  exchangeCode(code) {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: import.meta.env.VITE_REDIRECT_URI,
    })
    const basic = btoa(`${import.meta.env.VITE_CLIENT_ID}:${import.meta.env.VITE_CLIENT_SECRET}`)
    return axios
      .post(`${AUTH_BASE}/oauth2/token`, body.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${basic}`,
        },
      })
      .then((res) => res.data)
  },
}
