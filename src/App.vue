<script setup>
import { onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const navigating = ref(false)
let finishTimer

const removeBefore = router.beforeEach(() => {
  clearTimeout(finishTimer)
  navigating.value = true
})
const removeAfter = router.afterEach(() => {
  finishTimer = setTimeout(() => (navigating.value = false), 180)
})

onBeforeUnmount(() => {
  clearTimeout(finishTimer)
  removeBefore()
  removeAfter()
})
</script>

<template>
  <v-app>
    <div v-if="navigating" class="route-progress" aria-hidden="true" />
    <RouterView />
  </v-app>
</template>

<style scoped>
.route-progress {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999;
  width: 32%;
  height: 2px;
  background: var(--sk-red);
  box-shadow: 0 0 10px rgba(234, 0, 44, 0.35);
  animation: route-progress 0.9s ease-in-out infinite;
}
@keyframes route-progress {
  from {
    transform: translateX(-110%);
  }
  to {
    transform: translateX(420%);
  }
}
</style>
