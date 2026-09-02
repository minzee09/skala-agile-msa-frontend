<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import AppNav from '@/components/common/AppNav.vue'
import { useAuthStore } from '@/stores/auth'
import { useEnrollmentsStore } from '@/stores/enrollments'
import { deptLabel } from '@/data/directory'

const auth = useAuthStore()
const enrollments = useEnrollmentsStore()
const router = useRouter()

const items = computed(() => [
  { label: '내 학습 현황', to: { name: 'me-home' } },
  { label: '교육 과정', to: { name: 'me-courses' }, badge: enrollments.notDoneCount || null },
  { label: '이수증', to: { name: 'me-certificates' } },
])

const user = computed(() =>
  auth.profile
    ? { name: auth.profile.name, sub: `${deptLabel(auth.profile.dept) ?? ''} · 임직원` }
    : null,
)

function logout() {
  auth.logout()
  router.push({ name: 'start' })
}
</script>

<template>
  <div class="layout">
    <AppNav section-label="내 학습" :items="items" :user="user" @logout="logout" />
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
