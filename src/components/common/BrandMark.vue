<script setup>
import logoUrl from '@/assets/brand/sk-logo.png'

/** 공식 SK 워드마크 이미지. size는 표시 너비(px)다. */
defineProps({
  size: { type: Number, default: 30 },
  opacity: { type: Number, default: 1 },
})
</script>

<template>
  <img
    :src="logoUrl"
    alt=""
    :width="size"
    :height="Math.round(size * (705 / 900))"
    :style="{ opacity }"
    aria-hidden="true"
  />
</template>

<style scoped>
img {
  display: block;
  flex-shrink: 0;
  object-fit: contain;
}
</style>
