<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const message = ref('로그인 처리 중…')

onMounted(async () => {
  const { code, error } = route.query
  if (error || !code) {
    message.value = '로그인에 실패했습니다. 다시 시도해 주세요.'
    router.replace({ name: 'start' })
    return
  }
  try {
    await auth.handleCallback(String(code))
    router.replace(auth.homeRoute)
  } catch {
    message.value = '로그인 처리에 실패했습니다.'
    router.replace({ name: 'start' })
  }
})
</script>

<template>
  <div class="callback">
    <div class="callback__rule" />
    <p>{{ message }}</p>
  </div>
</template>

<style scoped>
.callback {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  color: var(--ink-600);
  font-size: 13px;
}
.callback__rule {
  width: 40px;
  height: 2px;
  background: var(--sk-red);
}
</style>
