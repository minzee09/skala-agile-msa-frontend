import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { usersApi } from '@/api/users'
import { USE_MOCK } from '@/api/http'
import { DIRECTORY, findEmployee } from '@/data/directory'

/** 화면 역할 ↔ 백엔드 Role. HR 담당자는 과정 등록 권한이 있는 INSTRUCTOR 로 매핑한다. */
export const ROLE = { HR: 'INSTRUCTOR', EMPLOYEE: 'STUDENT' }

// 백엔드 계정을 다시 만들지 않고 새 시연용 HR 메일로 로그인하기 위한 별칭.
const LEGACY_HR_LOGIN_EMAIL = 'sunyoung.park@sk.com'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref(sessionStorage.getItem('access_token'))
  const user = ref(JSON.parse(sessionStorage.getItem('user') ?? 'null'))
  /** 역할 선택 화면에서 고른 값 — 로그인 전에 어느 진입점으로 보낼지 결정 */
  const intendedRole = ref(sessionStorage.getItem('intended_role') ?? 'HR')

  const isAuthenticated = computed(() => Boolean(accessToken.value))
  const isHr = computed(() => user.value?.role === ROLE.HR)
  /** 디렉터리(부서·직무) 병합 프로필 */
  const profile = computed(() =>
    user.value ? { ...user.value, ...findEmployee(user.value.id) } : null,
  )
  const homeRoute = computed(() => (isHr.value ? { name: 'hr-dashboard' } : { name: 'me-home' }))

  function setIntendedRole(role) {
    intendedRole.value = role
    sessionStorage.setItem('intended_role', role)
  }

  function setToken(token) {
    accessToken.value = token
    sessionStorage.setItem('access_token', token)
  }

  function setUser(data) {
    user.value = data
    sessionStorage.setItem('user', JSON.stringify(data))
  }

  async function fetchUser() {
    setUser(await usersApi.me())
  }

  /** auth-server 로그인 화면으로 이동 (OAuth2 Authorization Code) */
  function redirectToLogin() {
    if (USE_MOCK) {
      // 시연: 인증 서버 없이 역할에 맞는 사용자로 바로 들어간다
      const person =
        intendedRole.value === 'HR'
          ? DIRECTORY.find((item) => item.role === ROLE.HR)
          : DIRECTORY.find((item) => item.role !== ROLE.HR)
      const mockUser = {
        id: person.userId,
        name: person.name,
        email: person.email,
        role: person.role === ROLE.HR ? ROLE.HR : ROLE.EMPLOYEE,
      }
      setToken('mock-token')
      setUser(mockUser)
      return
    }
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: import.meta.env.VITE_CLIENT_ID,
      redirect_uri: import.meta.env.VITE_REDIRECT_URI,
      scope: 'openid profile read write',
    })
    // 상대 경로로 보내 Vite 프록시를 태운다 — 세션 쿠키가 우리 오리진에 붙는다
    window.location.href = `/oauth2/authorize?${params}`
  }

  /**
   * 우리 화면의 입력값으로 로그인한다.
   * 목 모드: 사내 이메일로 디렉터리에서 찾아 바로 들어간다.
   * 실서버: 인증 서버 로그인 폼에 프록시로 자격증명을 보내 세션을 만든 뒤 인가 코드를 받는다.
   *         (백엔드 로그인 화면으로 튕기지 않는다)
   */
  async function loginWithPassword({ email, password }) {
    const id = String(email ?? '')
      .trim()
      .toLowerCase()
    if (USE_MOCK) {
      const person = DIRECTORY.find((e) => e.email.toLowerCase() === id)
      if (!person) throw new Error('등록되지 않은 사내 이메일입니다.')
      setToken('mock-token')
      setUser({
        id: person.userId,
        name: person.name,
        email: person.email,
        role: person.role === 'INSTRUCTOR' ? ROLE.HR : ROLE.EMPLOYEE,
      })
      return
    }
    const hrDemo = DIRECTORY.find((person) => person.role === ROLE.HR)
    const usernames = hrDemo?.email.toLowerCase() === id ? [id, LEGACY_HR_LOGIN_EMAIL] : [id]

    // 새 HR 메일이 아직 백엔드에 없으면 기존 시연 계정으로 한 번 더 인증한다.
    let authenticated = false
    for (const username of usernames) {
      const res = await fetch('/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username, password }),
        redirect: 'follow',
      })
      if (res.ok && !res.url.includes('login?error')) {
        authenticated = true
        break
      }
    }
    if (!authenticated) {
      throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.')
    }
    redirectToLogin()
  }

  async function handleCallback(code) {
    const token = (await usersApi.exchangeCode(code))?.access_token
    if (!token) throw new Error('액세스 토큰을 받지 못했습니다.')
    setToken(token)
    await fetchUser()
  }

  async function register({ email, password, name, role }) {
    return usersApi.register({ email, password, name, role })
  }

  function logout() {
    accessToken.value = null
    user.value = null
    sessionStorage.removeItem('access_token')
    sessionStorage.removeItem('user')
  }

  return {
    accessToken,
    user,
    profile,
    intendedRole,
    isAuthenticated,
    isHr,
    homeRoute,
    setIntendedRole,
    setToken,
    setUser,
    fetchUser,
    redirectToLogin,
    loginWithPassword,
    handleCallback,
    register,
    logout,
  }
})
