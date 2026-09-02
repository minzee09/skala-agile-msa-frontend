import { onUnmounted, ref, toValue, watch } from 'vue'

const easeOut = (t) => 1 - Math.pow(1 - t, 3)

/**
 * 숫자가 목표값까지 굴러 올라가는 값을 돌려준다. target·start 는 값/ref/게터 모두 받는다.
 * 사용자가 모션 최소화를 켜 두었으면 즉시 목표값으로 둔다.
 */
export function useCountUp(target, { duration = 900, decimals = 0, start = true } = {}) {
  const value = ref(0)
  let frame = null

  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true

  const round = (n) => Number(n.toFixed(decimals))

  function run(to) {
    if (frame) cancelAnimationFrame(frame)
    if (reduced) {
      value.value = round(to)
      return
    }
    const from = value.value
    const t0 = performance.now()
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / duration)
      value.value = round(from + (to - from) * easeOut(p))
      if (p < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
  }

  watch(
    [() => toValue(target), () => toValue(start)],
    ([to, go]) => {
      const n = Number(to)
      if (go && Number.isFinite(n)) run(n)
    },
    { immediate: true },
  )

  onUnmounted(() => frame && cancelAnimationFrame(frame))

  return value
}
