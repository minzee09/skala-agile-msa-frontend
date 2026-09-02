<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import BrandMark from '@/components/common/BrandMark.vue'
import { ROLE, useAuthStore } from '@/stores/auth'
import { DIRECTORY } from '@/data/directory'

const auth = useAuthStore()
const router = useRouter()

const ROLES = [
  {
    key: 'HR',
    title: 'HR 담당자',
    badge: '운영자',
    desc: '전사 이수 현황 · 과정 등록 · 대상자 선별',
  },
  { key: 'EMPLOYEE', title: '임직원', desc: '내 이수 현황 · 교육 과정 · 수강신청' },
]

const tab = ref('login')
const submitting = ref(false)
const message = ref('')
const error = ref('')
const form = reactive({ email: '', password: '', name: '' })

const roleLabel = computed(() => ROLES.find((r) => r.key === auth.intendedRole)?.title)

/** 선택한 역할의 시연 계정 — 클릭하면 입력란이 채워진다 */
const demoAccount = computed(() =>
  auth.intendedRole === 'HR'
    ? DIRECTORY.find((e) => e.role === 'INSTRUCTOR')
    : DIRECTORY.find((e) => e.role !== 'INSTRUCTOR'),
)

function useDemoAccount() {
  form.email = demoAccount.value?.email ?? ''
  form.password = 'SkDemo!2026'
}

async function login() {
  error.value = ''
  submitting.value = true
  try {
    await auth.loginWithPassword({ email: form.email, password: form.password })
    if (auth.isAuthenticated) router.push(auth.homeRoute)
  } catch (e) {
    error.value = e.response?.data?.message ?? e.message ?? '로그인에 실패했습니다.'
  } finally {
    submitting.value = false
  }
}

async function register() {
  submitting.value = true
  message.value = ''
  try {
    await auth.register({ ...form, role: ROLE[auth.intendedRole] })
    message.value = '가입이 완료되었습니다. 로그인해 주세요.'
    tab.value = 'login'
  } catch (e) {
    message.value = e.response?.data?.message ?? '가입에 실패했습니다.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="page">
    <!-- 역할 -->
    <section class="left">
      <BrandMark class="left__ghost" :size="700" :opacity="0.1" />
      <BrandMark class="left__ghost left__ghost--blur" :size="700" :opacity="0.35" />

      <div class="brand up" style="animation-delay: 0.9s">
        <BrandMark :size="30" />
        <span>법정의무교육 통합관리</span>
      </div>

      <div class="left__title up" style="animation-delay: 1.1s">
        <h1>어떤 역할로 이용하시나요?</h1>
        <p>역할에 따라 보이는 화면이 달라집니다.</p>
      </div>

      <ul class="roles">
        <li
          v-for="(r, i) in ROLES"
          :key="r.key"
          class="role up"
          :class="{ 'role--active': auth.intendedRole === r.key }"
          :style="{ animationDelay: `${1.3 + i * 0.1}s` }"
        >
          <button type="button" class="role__btn" @click="auth.setIntendedRole(r.key)">
            <span>
              <span class="role__title"
                >{{ r.title }}<small v-if="r.badge">{{ r.badge }}</small></span
              >
              <span class="role__desc">{{ r.desc }}</span>
            </span>
            <span class="role__check">
              <svg
                v-if="auth.intendedRole === r.key"
                width="9"
                height="9"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                stroke-width="3.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M5 12.5 9.5 17 19 7.5" />
              </svg>
            </span>
          </button>
        </li>
      </ul>

      <div class="curtain" aria-hidden="true" />
    </section>

    <!-- 로그인 / 회원가입 -->
    <section class="right">
      <div class="form">
        <div class="t-small up" style="animation-delay: 1.2s">
          {{ roleLabel }}로 {{ tab === 'login' ? '로그인' : '가입' }}
        </div>

        <div class="tabs up" style="animation-delay: 1.3s">
          <button type="button" :class="{ active: tab === 'login' }" @click="tab = 'login'">
            로그인
          </button>
          <button type="button" :class="{ active: tab === 'register' }" @click="tab = 'register'">
            회원가입
          </button>
        </div>

        <form
          v-if="tab === 'login'"
          class="fields up"
          style="animation-delay: 1.4s"
          @submit.prevent="login"
        >
          <v-text-field
            v-model="form.email"
            label="사내 이메일"
            type="email"
            autocomplete="username"
            required
          />
          <v-text-field
            v-model="form.password"
            label="비밀번호"
            type="password"
            autocomplete="current-password"
            required
          />
          <v-btn type="submit" color="primary" block height="44" :loading="submitting"
            >로그인</v-btn
          >
          <p v-if="error" class="t-small form__error">{{ error }}</p>
          <button v-if="demoAccount" type="button" class="demo" @click="useDemoAccount">
            시연 계정 채우기 — <span class="mono">{{ demoAccount.email }}</span>
          </button>
        </form>

        <form v-else class="register up" style="animation-delay: 1.4s" @submit.prevent="register">
          <v-text-field v-model="form.name" label="이름" required />
          <v-text-field v-model="form.email" label="사내 이메일" type="email" required />
          <v-text-field v-model="form.password" label="비밀번호" type="password" required />
          <v-btn type="submit" color="primary" block height="44" :loading="submitting"
            >회원가입</v-btn
          >
        </form>

        <p v-if="message" class="t-small" style="margin-top: 16px">{{ message }}</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.page {
  display: flex;
  min-height: 100vh;
}
.left {
  position: relative;
  width: 50%;
  overflow: hidden;
  background: var(--dark);
  color: #fff;
  padding: 40px 64px 40px 48px;
  display: flex;
  flex-direction: column;
}
.left__ghost {
  position: absolute;
  left: -120px;
  top: -110px;
  pointer-events: none;
  animation: fade 1.6s ease-out both 0.6s;
}
.left__ghost--blur {
  filter: blur(44px);
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  font-weight: 500;
  position: relative;
}
.left__title {
  margin-top: 160px;
  position: relative;
}
.left__title h1 {
  margin: 0;
  font-size: 32px;
  font-weight: 500;
  letter-spacing: -0.03em;
  line-height: 1.25;
}
.left__title p {
  margin: 12px 0 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
}
.roles {
  list-style: none;
  margin: 48px 0 0;
  padding: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.14);
  position: relative;
}
.role {
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
  border-left: 2px solid transparent;
  margin-left: -2px;
}
.role--active {
  border-left-color: var(--sk-red);
}
.role__btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22px 0 22px 22px;
  background: none;
  border: 0;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.role__title {
  display: block;
  font-size: 18px;
  font-weight: 500;
  letter-spacing: -0.02em;
  color: rgba(255, 255, 255, 0.7);
}
.role--active .role__title {
  color: #fff;
}
.role__title small {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.45);
  margin-left: 10px;
  letter-spacing: 0.04em;
}
.role__desc {
  display: block;
  margin-top: 6px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.45);
}
.role__check {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.3);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.role--active .role__check {
  background: var(--sk-red);
  border-color: var(--sk-red);
}
.curtain {
  position: absolute;
  inset: 0;
  background: var(--sk-red);
  z-index: 5;
  animation: curtain 0.9s cubic-bezier(0.7, 0, 0.2, 1) both 0.15s;
}
.right {
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--paper);
}
.form {
  width: 400px;
}
.tabs {
  display: flex;
  gap: 28px;
  margin-top: 16px;
  border-bottom: 1px solid var(--line);
}
.tabs button {
  background: none;
  border: 0;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  padding: 0 0 12px;
  font: inherit;
  font-size: 16px;
  font-weight: 500;
  color: var(--ink-400);
  cursor: pointer;
}
.tabs button.active {
  color: var(--ink-900);
  font-weight: 600;
  border-bottom-color: var(--ink-900);
}
.form__hint {
  margin: 40px 0 28px;
  font-size: 13px;
  color: var(--ink-600);
  line-height: 1.6;
}
.register,
.fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 32px;
}
.form__error {
  color: var(--sk-red-text);
  margin: 0;
}
.demo {
  align-self: flex-start;
  margin-top: 4px;
  padding: 0;
  background: none;
  border: 0;
  border-bottom: 1px solid var(--line-strong);
  font: inherit;
  font-size: 12px;
  color: var(--ink-400);
  cursor: pointer;
}
.demo:hover {
  color: var(--sk-red);
  border-color: var(--sk-red);
}
.up {
  animation: up 0.7s ease-out both;
}
@keyframes fade {
  from {
    opacity: 0;
  }
}
@keyframes curtain {
  to {
    transform: translateX(-101%);
  }
}
</style>
