<script setup>
import { computed } from 'vue'
import { deptLabel } from '@/data/directory'
import { fmtMonthDay } from '@/utils/date'

/** result: useScreeningStore().result, course: 대상 과정, dday: 'D-12' */
const props = defineProps({
  result: { type: Object, required: true },
  course: { type: Object, default: null },
  dday: { type: String, default: '' },
  /** 해석된 이수 상태 — 패널 문구를 조건에 맞춘다 */
  status: { type: String, default: 'NOT_COMPLETED' },
})

const max = computed(() => Math.max(...props.result.byDept.map((d) => d.count), 1))

const STATUS_LABEL = {
  NOT_COMPLETED: '미이수',
  IN_PROGRESS: '진행 중',
  COMPLETED: '이수 완료',
}
const statusLabel = computed(() => STATUS_LABEL[props.status] ?? '미이수')

/** 이수 이력 구분은 미이수 조건에서만 뜻이 있다 */
const showHistory = computed(() => props.status === 'NOT_COMPLETED')
</script>

<template>
  <aside class="panel">
    <div class="t-label">선별 결과</div>
    <div class="panel__total">
      <span class="num">{{ result.total }}</span
      ><span class="panel__unit">명</span>
    </div>
    <div class="t-small" style="color: var(--ink-600); margin-top: 10px">
      {{ course?.targetRule }} · {{ statusLabel }}
      <template v-if="course?.deadline">
        · 마감 <span class="mono">{{ fmtMonthDay(course.deadline) }}</span>
        <b class="t-red">{{ dday }}</b></template
      >
    </div>

    <hr />
    <div class="t-label">부서별</div>
    <ul class="depts">
      <li v-for="d in result.byDept" :key="d.dept">
        <span class="depts__name">{{ deptLabel(d.dept) }}</span>
        <span class="depts__track"
          ><i class="anim-grow" :style="{ width: `${(d.count / max) * 100}%` }"
        /></span>
        <span class="num depts__count">{{ d.count }}</span>
      </li>
    </ul>

    <template v-if="showHistory">
      <hr />
      <div class="t-label">이수 이력</div>
      <ul class="history">
        <li>
          <span>이력 없음 · 신규 대상</span><b class="num">{{ result.history.none }}</b>
        </li>
        <li>
          <span>작년 이수 · 갱신 필요</span><b class="num">{{ result.history.expired }}</b>
        </li>
      </ul>
    </template>

    <p class="t-small panel__note">해석 조건은 대화 내역과 함께 저장되어 감사 근거로 활용됩니다.</p>
  </aside>
</template>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--line);
  padding-left: 48px;
  height: 100%;
}
.panel__total {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-top: 10px;
}
.panel__total .num {
  font-size: 64px;
  font-weight: 500;
  letter-spacing: -0.04em;
  line-height: 1;
}
.panel__unit {
  font-size: 16px;
  color: var(--ink-600);
}
hr {
  border: 0;
  border-top: 1px solid var(--line);
  margin: 28px 0 24px;
}
.depts,
.history {
  list-style: none;
  margin: 14px 0 0;
  padding: 0;
}
.depts li {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  font-size: 13px;
}
.depts__name {
  width: 72px;
}
.depts__track {
  flex-grow: 1;
  height: 4px;
  background: var(--line);
}
.depts__track i {
  display: block;
  height: 100%;
  background: var(--ink-900);
}
.depts__count {
  width: 24px;
  text-align: right;
  font-weight: 500;
}
.history li {
  display: flex;
  justify-content: space-between;
  height: 34px;
  align-items: center;
  border-bottom: 1px solid var(--line);
  font-size: 13px;
}
.history li:last-child {
  border-bottom: 0;
}
.history b {
  font-weight: 500;
}
.panel__note {
  margin-top: auto;
  padding-top: 20px;
  border-top: 1px solid var(--line);
  color: var(--ink-600);
}
</style>
