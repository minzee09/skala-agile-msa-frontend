<script setup>
import { computed } from 'vue'
import { motion } from 'motion-v'

/** RevealGroup 안에서 한 박자씩 밀려 올라오는 블록 */
const props = defineProps({
  /** 올라오는 거리(px) */
  rise: { type: Number, default: 14 },
  as: { type: String, default: 'div' },
})

const variants = computed(() => ({
  hidden: { opacity: 0, y: props.rise },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.46, ease: [0.22, 0.8, 0.24, 1] },
  },
}))
</script>

<template>
  <component :is="motion[as]" :variants="variants" class="reveal-item">
    <slot />
  </component>
</template>

<style scoped>
.reveal-item {
  min-width: 0;
}
</style>
