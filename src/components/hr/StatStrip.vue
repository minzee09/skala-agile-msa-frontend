<script setup>
import RevealGroup from '@/components/common/RevealGroup.vue'
import RevealItem from '@/components/common/RevealItem.vue'
import AnimatedNumber from '@/components/common/AnimatedNumber.vue'
import SkeletonBlock from '@/components/common/SkeletonBlock.vue'

/** 헤어라인 사이 숫자 띠. stats: [{ label, value:Number, decimals?, unit?, sub?, tone?, dot? }] */
defineProps({
  stats: { type: Array, required: true },
  ready: { type: Boolean, default: true },
})
</script>

<template>
  <div class="strip">
    <template v-if="ready">
      <RevealGroup :ready="ready" :stagger="0.07" :delay="0.04">
        <RevealItem v-for="(s, i) in stats" :key="i" class="cell" :rise="10">
          <div class="cell__label">
            <span v-if="s.dot" class="cell__dot" :style="{ background: s.dot }" />
            <span class="t-small">{{ s.label }}</span>
          </div>
          <div class="cell__value" :class="{ 't-red': s.tone === 'red' }">
            <AnimatedNumber
              :value="s.value"
              :decimals="s.decimals ?? 0"
              :duration="1000"
              :start="ready"
            /><span v-if="s.unit" class="cell__unit">{{ s.unit }}</span>
          </div>
          <div v-if="s.sub" class="t-small cell__sub" v-html="s.sub" />
        </RevealItem>
      </RevealGroup>
    </template>

    <template v-else>
      <div v-for="i in 4" :key="i" class="cell">
        <SkeletonBlock :height="12" width="80px" :delay="i * 0.1" />
        <SkeletonBlock :height="34" width="60%" :delay="i * 0.1" style="margin-top: 14px" />
        <SkeletonBlock :height="12" width="70%" :delay="i * 0.1" style="margin-top: 14px" />
      </div>
    </template>
  </div>
</template>

<style scoped>
.strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
}
.cell {
  padding: 20px 24px;
  border-left: 1px solid var(--line);
}
.cell:first-child {
  padding-left: 0;
  border-left: 0;
}
.cell:last-child {
  padding-right: 0;
}
.cell__label {
  display: flex;
  align-items: center;
  gap: 6px;
}
.cell__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.cell__value {
  font-family: var(--font-num);
  font-variant-numeric: tabular-nums;
  font-size: 40px;
  font-weight: 500;
  letter-spacing: -0.03em;
  line-height: 1;
  margin-top: 14px;
}
.cell__unit {
  font-size: 22px;
  color: var(--ink-400);
  margin-left: 2px;
}
.cell__sub {
  color: var(--ink-600);
  margin-top: 12px;
}
</style>
