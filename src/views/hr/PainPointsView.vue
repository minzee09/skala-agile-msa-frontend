<script setup>
import PageHeader from '@/components/common/PageHeader.vue'
import HairlineTile from '@/components/common/HairlineTile.vue'

/**
 * 시연 도입: HR 담당자의 어려움 → 지금까지 → 이 서비스에서.
 * 숫자는 리서치에서 확인된 것만 쓴다(소요 시간 등 검증 안 된 수치는 넣지 않음).
 */
const POINTS = [
  {
    title: '대상자를 특정할 수 없다',
    desc: '"업무상 개인정보를 처리하는 자", "확정급여형 제도 가입 근로자" — 법령의 대상 조건은 서술형이라 인사 시스템의 직무 코드 한 칸으로 조회되지 않습니다.',
    before: '부서별 엑셀 취합 후 담당자가 한 명씩 판단',
    feature: '대상자 선별 · AI',
    how: '법령 문장을 그대로 입력하면 직무 5종 · 312명으로 변환. 해석 조건은 저장되어 감사 근거로 남습니다.',
    stat: '미이수 <b class="num t-red">88</b>명 · 즉시',
    to: { name: 'hr-screening' },
  },
  {
    title: '한 명만 놓쳐도 위반이다',
    desc: '과태료는 교육별로 독립 부과되고, 대상자 1명 누락도 위반으로 봅니다. 마감 전 개별 안내와 재안내를 사람이 반복해야 합니다.',
    before: '전체 공지 한 번, 이후 미이수자에게 수기 메일',
    feature: '수강 안내 발송',
    how: '신규·갱신 그룹별로 AI가 문안을 쓰고, 마감 D-7 · D-3에 미이수자에게만 자동 재발송. 발송 기록은 자동 저장.',
    stat: '개별 안내 <b class="num">88</b>건 · 1회 클릭',
    to: { name: 'hr-notice' },
  },
  {
    title: '법령이 바뀌면 과정을 다시 짠다',
    desc: '개정 조문에서 대상·주기·시간·근거를 읽어 과정을 등록하는 일은 매년, 교육마다 반복됩니다. 잘못 읽으면 대상자 산정부터 틀어집니다.',
    before: '법령 검색 → 요약 → 시스템 입력, 담당자 해석에 의존',
    feature: '과정 등록 자동 채움',
    how: '조문을 붙이면 과정명·유형·근거·주기·시간·마감·대상 조건 7개 항목을 채우고, HR은 확인만 합니다.',
    stat: '자동 입력 <b class="num">7</b>항목 · 확인 후 등록',
    to: { name: 'hr-course-create' },
  },
]

const FOOT = [
  {
    label: '과태료 상한 · 5종 합산',
    value: '≤ 5,300',
    unit: '만원',
    sub: '교육별 독립 부과 · 1명 누락도 위반',
  },
  { label: '증빙 보존 의무', value: '3', unit: '년', sub: '계획서 · 명단 · 자료 · 안내 기록' },
  { label: 'AI가 쓰이는 곳', value: '3', unit: '곳 · HR 전용', sub: '선별 · 문안 · 등록' },
  { label: '임직원이 하는 일', value: '1', unit: '번 클릭', sub: '수강신청 · 0원 즉시 확정' },
]
</script>

<template>
  <PageHeader title="HR 담당자가 매년 겪는 세 가지 어려움">
    <template #subtitle
      >법정의무교육 5종 · 임직원 1,248명 · 이 서비스가 각 어려움을 어디서 어떻게
      해소하는지</template
    >
    <template #actions
      ><v-btn color="primary" :to="{ name: 'hr-dashboard' }">시연 시작 →</v-btn></template
    >
  </PageHeader>

  <div class="grid anim-up" style="animation-delay: 0.15s">
    <article v-for="(p, i) in POINTS" :key="p.title" class="col">
      <div class="mono col__num">{{ String(i + 1).padStart(2, '0') }}</div>
      <h2 class="col__title">{{ p.title }}</h2>
      <p class="col__desc">{{ p.desc }}</p>
      <div class="col__before">
        <div class="t-label">지금까지</div>
        <p>{{ p.before }}</p>
      </div>
      <HairlineTile accent="teal" class="col__after">
        <div class="t-label">이 서비스에서</div>
        <RouterLink :to="p.to" class="col__feature">{{ p.feature }}</RouterLink>
        <p>{{ p.how }}</p>
        <div class="t-small col__stat" v-html="p.stat" />
      </HairlineTile>
    </article>
  </div>

  <footer class="foot anim-up" style="animation-delay: 0.3s">
    <div v-for="f in FOOT" :key="f.label">
      <div class="t-label">{{ f.label }}</div>
      <div class="num foot__value">
        {{ f.value }}<span>{{ f.unit }}</span>
      </div>
      <div class="t-small">{{ f.sub }}</div>
    </div>
  </footer>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 32px;
  border-top: 1px solid var(--line-strong);
}
.col {
  padding-top: 20px;
}
.col__num {
  font-size: 11px;
  color: var(--sk-red);
  letter-spacing: 0.06em;
}
.col__title {
  margin: 12px 0 0;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.35;
}
.col__desc {
  margin: 12px 0 0;
  min-height: 84px;
  font-size: 13px;
  color: var(--ink-600);
  line-height: 1.6;
}
.col__before {
  margin-top: 20px;
  padding-top: 14px;
  border-top: 1px solid var(--line);
}
.col__before p {
  margin: 6px 0 0;
  min-height: 40px;
  font-size: 13px;
  color: var(--ink-600);
}
.col__after {
  margin-top: 16px;
}
.col__feature {
  display: block;
  margin-top: 6px;
  font-size: 14px;
  font-weight: 600;
  border: 0;
}
.col__after p {
  margin: 6px 0 0;
  min-height: 60px;
  font-size: 13px;
  color: var(--ink-600);
  line-height: 1.55;
}
.col__stat {
  margin-top: 10px;
  color: var(--ink-600);
}
.foot {
  margin-top: auto;
  padding-top: 20px;
  border-top: 1px solid var(--line);
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 32px;
}
.foot__value {
  font-size: 22px;
  font-weight: 500;
  letter-spacing: -0.02em;
  margin: 6px 0 4px;
}
.foot__value span {
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--ink-400);
  margin-left: 3px;
}
</style>
