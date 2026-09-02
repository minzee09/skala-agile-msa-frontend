<script setup>
/** 헤어라인 타일. accent: 'red' | 'teal' | null — 화면당 색면은 한 곳만. */
defineProps({
  accent: { type: String, default: null },
  outlined: { type: Boolean, default: true },
})
</script>

<template>
  <div class="tile" :class="[accent && `tile--${accent}`, { 'tile--plain': !outlined }]">
    <slot />
  </div>
</template>

<style scoped>
.tile {
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface);
  padding: 14px 16px;
}
.tile--plain {
  border-color: transparent;
  background: transparent;
  padding: 0;
}
.tile--red {
  background: var(--sk-red-tint);
}
.tile--teal {
  background: var(--sk-teal-tint);
  border-color: transparent;
}
</style>
