import { onUnmounted, ref } from 'vue'

/**
 * 절차가 있는 화면(과정 등록 · 대상자 선별 · 안내 발송 · 증빙)에서 단계를 하나씩 여는 장치.
 *
 * 화면 전체를 한 번에 띄우지 않고, 실제로 끝난 단계까지만 보여 준다.
 * - 서버/AI 응답이 도착할 때마다 open(n) 으로 그 단계를 연다.
 * - 한 번의 응답으로 여러 단계가 동시에 확정되면 runTo(n) 으로 한 박자씩 이어 연다.
 * 응답 자체를 늦추지 않으므로 실서버에 붙여도 같은 순서로 동작한다.
 */
export function useSteps({ beat = 240 } = {}) {
  const step = ref(0)
  let timers = []

  const clear = () => {
    timers.forEach(clearTimeout)
    timers = []
  }

  /** 곧바로 n 단계까지 연다 */
  const open = (n) => {
    if (n > step.value) {
      clear()
      step.value = n
    }
  }

  /** 현재 단계부터 n 단계까지 beat 간격으로 하나씩 연다 */
  const runTo = (n) => {
    clear()
    const from = step.value
    for (let i = from + 1; i <= n; i += 1) {
      timers.push(setTimeout(() => (step.value = i), beat * (i - from)))
    }
  }

  const reset = () => {
    clear()
    step.value = 0
  }

  /** 템플릿에서 v-if="reached(2)" 처럼 쓴다 */
  const reached = (n) => step.value >= n

  onUnmounted(clear)

  return { step, open, runTo, reset, reached }
}
