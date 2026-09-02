<script setup>
import { onBeforeUnmount, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import BrandMark from '@/components/common/BrandMark.vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()
let timer

onMounted(() => {
  timer = setTimeout(
    () => router.replace(auth.isAuthenticated ? auth.homeRoute : { name: 'start' }),
    4400,
  )
})
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div class="splash" @click="router.replace({ name: 'start' })">
    <div class="splash__grid" aria-hidden="true"><span v-for="i in 12" :key="i" /></div>
    <BrandMark class="splash__ghost" :size="920" :opacity="0.1" />
    <BrandMark class="splash__ghost splash__ghost--blur" :size="920" :opacity="0.35" />
    <div class="splash__scan" aria-hidden="true" />

    <div class="splash__corner splash__corner--l">SK AX</div>
    <div class="splash__corner splash__corner--r mono">2026</div>

    <div class="splash__center">
      <BrandMark :size="72" class="up" style="animation-delay: 1.1s" />
      <div class="splash__title up" style="animation-delay: 1.35s">법정의무교육 통합관리</div>
      <div class="splash__sub up" style="animation-delay: 1.55s">
        법정의무교육 대상자 선별과 이수 관리
      </div>
    </div>

    <div class="splash__progress up" style="animation-delay: 1.8s"><span /></div>
  </div>
</template>

<style scoped>
.splash {
  position: relative;
  min-height: 100vh;
  background: var(--dark);
  color: #fff;
  overflow: hidden;
  cursor: pointer;
}
.splash__grid {
  position: absolute;
  inset: 0 48px;
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 24px;
  pointer-events: none;
  animation: fade 1.4s ease-out both 0.2s;
}
.splash__grid span {
  border-right: 1px solid rgba(255, 255, 255, 0.05);
}
.splash__grid span:first-child {
  border-left: 1px solid rgba(255, 255, 255, 0.05);
}
.splash__ghost {
  position: absolute;
  right: -140px;
  bottom: -160px;
  pointer-events: none;
  animation:
    fade 2s ease-out both 0.3s,
    drift 14s ease-in-out infinite alternate;
}
.splash__ghost--blur {
  filter: blur(48px);
}
.splash__scan {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--sk-red);
  box-shadow: 0 0 24px rgba(234, 0, 44, 0.8);
  animation: scan 1.8s cubic-bezier(0.65, 0, 0.35, 1) both 0.1s;
}
.splash__corner {
  position: absolute;
  top: 40px;
  font-size: 12px;
  letter-spacing: 0.04em;
  color: rgba(255, 255, 255, 0.45);
  animation: up 0.8s ease-out both 1s;
}
.splash__corner--l {
  left: 48px;
  font-weight: 500;
}
.splash__corner--r {
  right: 48px;
  color: rgba(255, 255, 255, 0.35);
}
.splash__center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.up {
  animation: up 0.8s ease-out both;
}
.splash__title {
  font-size: 34px;
  font-weight: 500;
  letter-spacing: -0.03em;
  margin-top: 36px;
}
.splash__sub {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 14px;
}
.splash__progress {
  position: absolute;
  left: 50%;
  bottom: 64px;
  width: 200px;
  margin-left: -100px;
  height: 1px;
  background: rgba(255, 255, 255, 0.12);
}
.splash__progress span {
  position: absolute;
  left: 0;
  top: -1px;
  height: 3px;
  background: var(--sk-red);
  animation: fill 2.4s cubic-bezier(0.4, 0, 0.2, 1) both 2s;
}
@keyframes fade {
  from {
    opacity: 0;
  }
}
@keyframes drift {
  to {
    transform: translate(-28px, -18px);
  }
}
@keyframes scan {
  0% {
    left: -2px;
    opacity: 0;
  }
  8%,
  92% {
    opacity: 1;
  }
  100% {
    left: 100%;
    opacity: 0;
  }
}
@keyframes fill {
  from {
    width: 0;
  }
  to {
    width: 100%;
  }
}
</style>
