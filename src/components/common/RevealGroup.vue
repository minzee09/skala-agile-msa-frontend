<script setup>
import { computed } from 'vue'
import { motion } from 'motion-v'

/**
 * 순차 등장 오케스트레이터. 데이터가 도착(ready)한 뒤에야 자식 RevealItem 이 차례로 나타난다.
 * display:contents 라서 기존 그리드·플렉스 레이아웃을 건드리지 않는다.
 */
const props = defineProps({
  ready: { type: Boolean, default: true },
  /** 항목 간 간격(초) */
  stagger: { type: Number, default: 0.085 },
  /** 첫 항목까지의 지연(초) */
  delay: { type: Number, default: 0.06 },
  /** 레이아웃에 개입해야 할 때만 false */
  contents: { type: Boolean, default: true },
})

const variants = computed(() => ({
  hidden: {},
  show: { transition: { staggerChildren: props.stagger, delayChildren: props.delay } },
}))
</script>

<template>
  <motion.div
    :class="{ contents }"
    :variants="variants"
    initial="hidden"
    :animate="ready ? 'show' : 'hidden'"
  >
    <slot />
  </motion.div>
</template>

<style scoped>
.contents {
  display: contents;
}
</style>
