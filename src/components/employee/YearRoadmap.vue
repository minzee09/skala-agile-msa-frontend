<script setup>
import { computed } from 'vue'
import { today } from '@/composables/useDday'
import { fmtDday, fmtMonthDay, yearFraction } from '@/utils/date'

/**
 * 연간 이수 로드맵 (SVG). 레이블 220px + 트랙 W. 이수 완료는 이수일에 점, 미이수는 마감일에 빈 점.
 * plotly 없이 그린다 — 마크가 몇 개뿐이라 라이브러리가 과하다.
 */
const props = defineProps({ courses: { type: Array, required: true } })

const X0 = 220
const W = 856
const ROW = 30
const x = (d) => X0 + yearFraction(d) * W
const ticks = [0, 3, 6, 9].map((m) => ({ label: `${m + 1}월`, x: X0 + (m / 12) * W }))
const height = computed(() => props.courses.length * ROW + 30)
const todayX = computed(() => x(today()))
const rows = computed(() =>
  props.courses.map((c, i) => {
    const y = 20 + i * ROW
    const done = c.status === 'DONE'
    const at = done ? c.completedAt : c.deadline
    return {
      ...c,
      y,
      done,
      px: at ? x(at) : null,
      at,
      label: at ? (done ? fmtMonthDay(at) : `${fmtMonthDay(at)} · ${fmtDday(at, today())}`) : '',
    }
  }),
)
</script>

<template>
  <section>
    <div class="head">
      <h2 class="t-h2" style="margin: 0">연간 이수 로드맵</h2>
      <div class="legend">
        <span><i class="done" />이수 완료</span><span><i class="due" />마감 임박</span
        ><span><i class="later" />예정</span>
      </div>
    </div>
    <svg :viewBox="`0 0 ${X0 + W} ${height}`" class="chart">
      <line
        v-for="t in ticks"
        :key="t.label"
        :x1="t.x"
        :x2="t.x"
        y1="6"
        :y2="height - 22"
        stroke="#E6E6E2"
      />
      <line :x1="X0 + W" :x2="X0 + W" y1="6" :y2="height - 22" stroke="#E6E6E2" />
      <line
        :x1="todayX"
        :x2="todayX"
        y1="0"
        :y2="height - 18"
        stroke="#EA002C"
        stroke-dasharray="2 3"
      />
      <text :x="todayX + 6" y="9" class="lab lab--today">오늘 {{ fmtMonthDay(today()) }}</text>

      <g v-for="r in rows" :key="r.id">
        <text x="0" :y="r.y + 4" class="name" :class="{ strong: !r.done && r.urgent }">
          {{ r.title }}
        </text>
        <template v-if="r.px">
          <line
            :x1="X0"
            :x2="r.px"
            :y1="r.y"
            :y2="r.y"
            :stroke="r.done ? '#009A93' : r.urgent ? '#EA002C' : '#9A9A9A'"
            stroke-opacity="0.25"
            stroke-width="2"
          />
          <circle
            :cx="r.px"
            :cy="r.y"
            r="4.5"
            :fill="r.done ? '#009A93' : '#FAFAF8'"
            :stroke="r.done ? 'none' : r.urgent ? '#EA002C' : '#9A9A9A'"
            stroke-width="1.5"
          />
          <text
            :x="r.px + 10"
            :y="r.y + 4"
            class="lab"
            :class="{ 'lab--red': !r.done && r.urgent }"
          >
            {{ r.label }}
          </text>
        </template>
      </g>

      <text
        v-for="t in ticks"
        :key="`t-${t.label}`"
        :x="t.x"
        :y="height - 3"
        text-anchor="middle"
        class="axis"
      >
        {{ t.label }}
      </text>
      <text :x="X0 + W" :y="height - 3" text-anchor="middle" class="axis">12월 말</text>
    </svg>
  </section>
</template>

<style scoped>
.head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}
.legend {
  display: flex;
  gap: 16px;
  font-size: 11px;
  color: var(--ink-600);
}
.legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.legend i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--paper);
  border: 1.5px solid var(--ink-400);
}
.legend i.done {
  background: var(--sk-teal);
  border-color: var(--sk-teal);
}
.legend i.due {
  border-color: var(--sk-red);
}
.chart {
  display: block;
  width: 100%;
  margin-top: 14px;
}
.name {
  font-size: 13px;
  fill: var(--ink-900);
}
.name.strong {
  font-weight: 600;
}
.lab {
  font-family: var(--font-mono);
  font-size: 11px;
  fill: var(--ink-600);
  paint-order: stroke;
  stroke: #fafaf8;
  stroke-width: 4px;
}
.lab--red {
  fill: var(--sk-red-text);
  font-weight: 600;
}
.lab--today {
  font-size: 10px;
  fill: var(--sk-red-text);
}
.axis {
  font-size: 10px;
  fill: var(--ink-400);
}
</style>
