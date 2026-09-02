<script setup>
import { computed } from 'vue'
import { useCountUp } from '@/composables/useCountUp'

/** 값이 굴러 올라가는 숫자. 자릿수가 흔들리지 않도록 항상 tabular-nums 로 그린다. */
const props = defineProps({
  value: { type: Number, required: true },
  decimals: { type: Number, default: 0 },
  duration: { type: Number, default: 900 },
  /** 데이터가 도착한 뒤에만 굴린다 */
  start: { type: Boolean, default: true },
  /** 1,248 처럼 천 단위 구분 */
  group: { type: Boolean, default: true },
})

const current = useCountUp(() => props.value, {
  duration: props.duration,
  decimals: props.decimals,
  start: () => props.start,
})

const text = computed(() =>
  props.group
    ? current.value.toLocaleString('ko-KR', {
        minimumFractionDigits: props.decimals,
        maximumFractionDigits: props.decimals,
      })
    : current.value.toFixed(props.decimals),
)
</script>

<template>
  <span class="num">{{ text }}</span>
</template>
