<script setup>
/** 데이터 대기 자리표시. 옅은 헤어라인 톤 위로 짧은 빛이 지나간다. */
defineProps({
  height: { type: [Number, String], default: 16 },
  width: { type: [Number, String], default: '100%' },
  delay: { type: Number, default: 0 },
})
const size = (v) => (typeof v === 'number' ? `${v}px` : v)
</script>

<template>
  <span
    class="sk"
    :style="{ height: size(height), width: size(width), animationDelay: `${delay}s` }"
    aria-hidden="true"
  />
</template>

<style scoped>
.sk {
  display: block;
  background: linear-gradient(
    100deg,
    var(--surface-muted) 25%,
    #fafaf8 42%,
    var(--surface-muted) 60%
  );
  background-size: 240% 100%;
  border-radius: var(--radius);
  animation: shimmer 1.4s ease-in-out infinite;
}
@keyframes shimmer {
  from {
    background-position: 100% 0;
  }
  to {
    background-position: -100% 0;
  }
}
</style>
