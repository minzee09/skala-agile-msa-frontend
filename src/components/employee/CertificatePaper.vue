<script setup>
import { computed } from 'vue'
import { motion } from 'motion-v'
import BrandMark from '@/components/common/BrandMark.vue'
import { deptLabel, jobLabel } from '@/data/directory'
import { fmtDate, fmtKoreanDate } from '@/utils/date'
import { particle } from '@/utils/korean'

/** 이수증 본체 — 인쇄/PDF 로 그대로 나가는 문서. cert: toCertificate() 결과 */
const props = defineProps({
  cert: { type: Object, required: true },
  company: { type: String, default: '주식회사 에스케이' },
  issuedOn: { type: [String, Date], required: true },
})

const c = computed(() => props.cert)
const fields = computed(() => [
  { k: '성명', v: c.value.holder.name, strong: true },
  { k: '사번', v: c.value.holder.employeeNo, mono: true },
  {
    k: '소속',
    v: `${deptLabel(c.value.holder.dept)} · ${jobLabel(c.value.holder.job)}`,
  },
])
const courseFields = computed(() => [
  { k: '교육과정', v: c.value.course.title, strong: true },
  { k: '근거법령', v: c.value.course.law },
  { k: '교육시간', v: `${c.value.course.minutes}분`, num: true },
  { k: '이수일', v: fmtKoreanDate(c.value.completedAt) },
  { k: '유효기간', v: `${fmtDate(c.value.validUntil)}까지 · ${c.value.course.cycle}` },
])
const lawShort = computed(() => c.value.course.law.replace(/\s제.*$/, ''))
const article = computed(() => c.value.course.law.match(/제[\d조의]+/)?.[0] ?? '')
const titleParticle = computed(() => particle(c.value.course.title))
</script>

<template>
  <div class="mat">
    <motion.article
      class="paper"
      :initial="{ opacity: 0, y: 16 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ type: 'spring', stiffness: 140, damping: 20, mass: 0.9 }"
    >
      <header class="paper__head">
        <div class="paper__no">
          발급번호 <span class="mono">{{ c.no }}</span>
        </div>
        <BrandMark :size="34" />
      </header>

      <h1 class="paper__title">
        이 수 증
        <small>CERTIFICATE OF COMPLETION</small>
      </h1>

      <motion.dl
        class="fields"
        :initial="{ opacity: 0 }"
        :animate="{ opacity: 1 }"
        :transition="{ delay: 0.15, duration: 0.4 }"
      >
        <template v-for="f in fields" :key="f.k">
          <dt>{{ f.k }}</dt>
          <dd :class="{ strong: f.strong, mono: f.mono }">{{ f.v }}</dd>
        </template>
      </motion.dl>

      <motion.dl
        class="fields fields--course"
        :initial="{ opacity: 0 }"
        :animate="{ opacity: 1 }"
        :transition="{ delay: 0.25, duration: 0.4 }"
      >
        <template v-for="f in courseFields" :key="f.k">
          <dt>{{ f.k }}</dt>
          <dd :class="{ strong: f.strong, num: f.num }">{{ f.v }}</dd>
        </template>
      </motion.dl>

      <p class="statement">
        위 사람은 「{{ lawShort }}」 {{ article }}에 따른 <b>{{ c.course.title }}</b
        >{{ titleParticle }} 정해진 시간 이상 이수하였음을 증명합니다.
      </p>

      <div class="issue">
        <div class="issue__date">{{ fmtKoreanDate(c.completedAt) }}</div>
        <div class="issue__org">
          <span>{{ company }} · 인사팀</span>
          <span class="seal" aria-label="인사팀 직인">인사팀<br />직인</span>
        </div>
      </div>

      <footer class="paper__foot">
        <span>본 이수증은 학습 이력에서 자동 생성되며 발급번호로 진위를 확인할 수 있습니다.</span>
        <span
          >발급 <span class="mono">{{ fmtDate(issuedOn) }}</span></span
        >
      </footer>
    </motion.article>
  </div>
</template>

<style scoped>
.mat {
  background: #efefec;
  padding: 20px;
}
.paper {
  background: #fff;
  border: 1px solid #d5d5d0;
  padding: 34px 44px 28px;
}
.paper__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}
.paper__no {
  font-size: 11px;
  color: var(--ink-600);
}
.paper__no .mono {
  color: var(--ink-900);
}
.paper__title {
  margin: 20px 0 0;
  text-align: center;
  font-size: 30px;
  font-weight: 600;
  letter-spacing: 0.28em;
  text-indent: 0.28em;
}
.paper__title small {
  display: block;
  margin-top: 8px;
  font-family: var(--font-num);
  font-size: 10px;
  font-weight: 400;
  letter-spacing: 0.18em;
  color: var(--ink-400);
}
.fields {
  display: grid;
  grid-template-columns: 84px minmax(0, 1fr);
  margin: 28px 0 0;
  border-top: 1px solid var(--ink-900);
}
.fields--course {
  margin-top: 0;
  border-top: 0;
}
.fields dt,
.fields dd {
  margin: 0;
  padding: 9px 0;
  border-bottom: 1px solid var(--line);
  font-size: 13px;
  line-height: 1.5;
}
.fields dt {
  color: var(--ink-400);
  font-size: 11px;
  letter-spacing: 0.1em;
  padding-top: 12px;
}
.fields dd.strong {
  font-weight: 600;
  letter-spacing: -0.01em;
}
.statement {
  margin: 26px 0 0;
  font-size: 13.5px;
  line-height: 1.85;
  text-align: center;
}
.statement b {
  font-weight: 600;
}
.issue {
  margin-top: 30px;
  text-align: center;
}
.issue__date {
  font-family: var(--font-num);
  font-size: 14px;
  letter-spacing: 0.04em;
  color: var(--ink-600);
}
.issue__org {
  margin-top: 14px;
  display: inline-flex;
  align-items: center;
  gap: 16px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.01em;
}
.seal {
  width: 52px;
  height: 52px;
  border: 1px solid var(--sk-red);
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 500;
  line-height: 1.3;
  letter-spacing: 0.06em;
  color: var(--sk-red);
  opacity: 0.75;
}
.paper__foot {
  margin-top: 30px;
  padding-top: 10px;
  border-top: 1px solid var(--line-strong);
  display: flex;
  justify-content: space-between;
  font-size: 10.5px;
  color: var(--ink-400);
}
</style>
