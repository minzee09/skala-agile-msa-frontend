<script setup>
import HairlineTile from '@/components/common/HairlineTile.vue'

/** AI 생성 문안 편집기. draft: { subject, body }, v-model 로 수정 가능. */
const draft = defineModel({ type: Object, required: true })
defineProps({
  groupLabel: { type: String, required: true },
  groupCount: { type: Number, required: true },
  tone: { type: String, required: true },
  loading: { type: Boolean, default: false },
  basis: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:tone', 'regenerate'])
const TONES = ['정중', '간결', '강조']
const CHECKS = ['대상 사유 반영', '이수 이력·마감 반영', '개인별 정보 치환']
</script>

<template>
  <HairlineTile accent="teal" class="editor">
    <div class="editor__head">
      <div class="t-label">
        AI 맞춤 문안 <span class="editor__group">{{ groupLabel }} · {{ groupCount }}명</span>
      </div>
      <div class="editor__tools">
        <button
          v-for="t in TONES"
          :key="t"
          type="button"
          class="tone"
          :class="{ 'tone--active': tone === t }"
          @click="emit('update:tone', t)"
        >
          {{ t }}
        </button>
        <a href="#" class="t-small" style="margin-left: 10px" @click.prevent="emit('regenerate')">{{
          loading ? '생성 중…' : '다시 생성'
        }}</a>
      </div>
    </div>

    <div class="basis">
      <span class="t-label">AI 맞춤 기준</span>
      <span v-for="item in basis" :key="item" class="basis__item">{{ item }}</span>
    </div>

    <label class="field">
      <span class="t-label">제목</span>
      <input v-model="draft.subject" class="field__subject" />
    </label>

    <label class="field">
      <span class="t-label"
        >본문 <span style="margin-left: 6px">이름·마감일은 대상자별로 치환</span></span
      >
      <textarea v-model="draft.body" class="field__body" rows="6" />
    </label>

    <ul class="checks">
      <li v-for="c in CHECKS" :key="c"><i />{{ c }}</li>
    </ul>
  </HairlineTile>
</template>

<style scoped>
.editor {
  padding: 20px;
}
.editor__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.editor__group {
  color: var(--ink-900);
  margin-left: 6px;
}
.editor__tools {
  display: flex;
  align-items: center;
  gap: 6px;
}
.basis {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 14px;
  padding: 10px 0;
  border-top: 1px solid rgba(0, 154, 147, 0.2);
  border-bottom: 1px solid rgba(0, 154, 147, 0.2);
}
.basis .t-label {
  margin-right: 4px;
  color: var(--sk-teal);
}
.basis__item {
  padding: 2px 6px;
  border: 1px solid rgba(0, 154, 147, 0.25);
  background: var(--surface);
  color: var(--ink-600);
  font-size: 11px;
}
.tone {
  height: 26px;
  padding: 0 10px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius);
  background: none;
  font: inherit;
  font-size: 12px;
  color: var(--ink-600);
  cursor: pointer;
}
.tone--active {
  border-color: var(--ink-900);
  color: var(--ink-900);
  font-weight: 500;
}
.field {
  display: block;
  margin-top: 16px;
}
.field__subject,
.field__body {
  display: block;
  width: 100%;
  border: 0;
  border-bottom: 1px solid rgba(0, 154, 147, 0.35);
  background: none;
  font: inherit;
  outline: none;
  resize: none;
}
.field__subject {
  height: 40px;
  font-size: 15px;
  font-weight: 500;
}
.field__body {
  margin-top: 8px;
  padding-bottom: 8px;
  font-size: 14px;
  line-height: 1.7;
}
.checks {
  list-style: none;
  display: flex;
  gap: 16px;
  margin: 16px 0 0;
  padding: 0;
  font-size: 12px;
  color: var(--ink-600);
}
.checks li {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.checks i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--sk-teal);
}
</style>
