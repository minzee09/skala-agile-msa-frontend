<script setup>
/**
 * 얇은 분절 바. segments: [{ value(%), color }]. 2px 간격, 라운드 없음.
 * 시연 모션(scaleX)은 animate 로 켠다.
 */
defineProps({
  segments: { type: Array, required: true },
  height: { type: Number, default: 6 },
  animate: { type: Boolean, default: true },
  delay: { type: Number, default: 0.5 },
})
</script>

<template>
  <div
    class="bar"
    :class="{ 'anim-grow': animate }"
    :style="{ height: `${height}px`, animationDelay: `${delay}s` }"
    role="img"
  >
    <div
      v-for="(s, i) in segments"
      :key="i"
      :style="{ width: `${s.value}%`, background: s.color }"
    />
  </div>
</template>

<style scoped>
.bar {
  display: flex;
  gap: 2px;
}
</style>
