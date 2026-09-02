<script setup>
/** 00 — 과정 근거와 대상 조건을 나눠 입력하고 함께 해석한다. 화면에서 색면을 쓰는 유일한 블록. */
const lawText = defineModel('lawText', { type: String, required: true })
const targetText = defineModel('targetText', { type: String, required: true })
defineProps({
  filledCount: { type: Number, default: 0 },
  loading: { type: Boolean, default: false },
  suggestions: { type: Array, default: () => [] },
})
const emit = defineEmits(['interpret'])

function useSuggestion(item) {
  lawText.value = item.lawText
  targetText.value = item.targetText
}
</script>

<template>
  <section class="request">
    <header class="request__head">
      <div>
        <div class="t-label">00 — 과정 등록 요청</div>
        <h2>법령과 대상 조건을 적어주세요</h2>
      </div>
      <span class="ai"><i />AI 지원</span>
    </header>

    <div class="fields">
      <label>
        <span class="cap"><b>법령 · 공고문</b><small>과정명 · 주기 · 이수시간의 근거</small></span>
        <textarea
          v-model="lawText"
          rows="3"
          placeholder="예) 개인정보보호법 제28조에 따라 필요한 교육을 연 1회 실시"
          @keydown.ctrl.enter.prevent="emit('interpret')"
          @keydown.meta.enter.prevent="emit('interpret')"
        />
      </label>
      <label>
        <span class="cap"><b>대상자 조건</b><small>직무 · 인원 선별 기준</small></span>
        <textarea
          v-model="targetText"
          rows="3"
          placeholder="예) 업무상 개인정보를 처리하는 자"
          @keydown.ctrl.enter.prevent="emit('interpret')"
          @keydown.meta.enter.prevent="emit('interpret')"
        />
      </label>
    </div>

    <div class="examples">
      <span class="t-label">예시</span>
      <button
        v-for="item in suggestions"
        :key="item.label"
        type="button"
        @click="useSuggestion(item)"
      >
        {{ item.label }}
      </button>
    </div>

    <footer class="request__foot">
      <p v-if="loading" class="note" aria-live="polite">
        <i />대상 조건을 직무와 임직원 범위로 변환하는 중…
      </p>
      <p v-else-if="filledCount" class="note">
        <i /><b class="num">{{ filledCount }}</b
        >개 항목을 채웠습니다. 아래에서 확인 후 수정할 수 있습니다.
      </p>
      <p v-else class="t-small">
        대상자 조건만 직무·인원으로 변환됩니다. 법령 문구는 그대로 보관됩니다.
      </p>

      <v-btn
        color="primary"
        height="36"
        :loading="loading"
        :disabled="!lawText.trim() || !targetText.trim()"
        @click="emit('interpret')"
      >
        {{ filledCount ? '다시 해석' : '입력 내용 해석' }}
      </v-btn>
    </footer>
  </section>
</template>

<style scoped>
.request {
  background: var(--sk-teal-tint);
  padding: 22px 24px;
}
.request__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
}
.request__head h2 {
  margin: 8px 0 0;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.ai {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.04em;
  color: var(--ink-600);
}
.ai i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--sk-teal);
}
.fields {
  display: grid;
  grid-template-columns: 1.35fr 0.65fr;
  gap: 24px;
  margin-top: 20px;
}
.cap {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}
.cap b {
  font-size: 12px;
  font-weight: 600;
}
.cap small {
  font-size: 10px;
  color: var(--ink-400);
}
.fields textarea {
  display: block;
  width: 100%;
  margin-top: 8px;
  padding: 10px 12px;
  border: 1px solid rgba(0, 154, 147, 0.35);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--ink-900);
  font: inherit;
  font-size: 13px;
  line-height: 1.6;
  resize: vertical;
  outline: none;
}
.fields textarea:focus {
  border-color: var(--sk-teal);
}
.examples {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 14px;
}
.examples button {
  padding: 3px 8px;
  border: 1px solid rgba(0, 154, 147, 0.35);
  border-radius: var(--radius);
  background: none;
  color: var(--ink-600);
  font: inherit;
  font-size: 11px;
  cursor: pointer;
}
.examples button:hover {
  border-color: var(--sk-teal);
  color: var(--ink-900);
}
.request__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 154, 147, 0.25);
}
.note {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 12px;
  color: var(--ink-600);
}
.note i {
  width: 6px;
  height: 6px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--sk-teal);
}
.note b {
  color: var(--ink-900);
  font-weight: 600;
}
</style>
