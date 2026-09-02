<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import AppNav from '@/components/common/AppNav.vue'
import { useAuthStore } from '@/stores/auth'
import { deptLabel } from '@/data/directory'

const auth = useAuthStore()
const router = useRouter()

const items = [
  { label: '대시보드', to: { name: 'hr-dashboard' } },
  { label: '과정 관리', to: { name: 'hr-course-create' }, tag: 'AI' },
  { label: '대상자 선별', to: { name: 'hr-screening' }, tag: 'AI' },
  { label: '알림 발송', to: { name: 'hr-notice' }, tag: 'AI' },
]

const user = computed(() =>
  auth.profile
    ? { name: auth.profile.name, sub: `${deptLabel(auth.profile.dept) ?? ''} · HR` }
    : null,
)

function logout() {
  auth.logout()
  router.push({ name: 'start' })
}
</script>

<template>
  <div class="layout">
    <AppNav section-label="HR 운영" :items="items" :user="user" @logout="logout" />
    <main class="content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  align-items: flex-start;
  min-height: 100vh;
  padding-left: var(--nav-width);
}
.content {
  flex-grow: 1;
  min-width: 0;
  min-height: 100vh;
  padding: var(--content-pad-y) var(--content-pad-x) var(--content-pad-bottom);
  display: flex;
  flex-direction: column;
  gap: var(--section-gap);
}
</style>
