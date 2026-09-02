<script setup>
/** 발송 설정. settings: { channels: { mail, messenger, sms }, when: 'NOW'|'SCHEDULED', remind: boolean } */
const settings = defineModel({ type: Object, required: true })
defineProps({
  preview: { type: Object, required: true }, // { to, subject, body }
  total: { type: Number, required: true },
})
const CHANNELS = [
  { key: 'mail', label: '사내 메일' },
  { key: 'messenger', label: '사내 메신저' },
  { key: 'sms', label: '문자' },
]
</script>

<template>
  <aside class="settings">
    <div class="t-label">발송 설정</div>
    <ul class="rows">
      <li v-for="c in CHANNELS" :key="c.key">
        <span>{{ c.label }}</span>
        <button
          type="button"
          class="check"
          :class="{ 'check--on': settings.channels[c.key] }"
          :aria-pressed="settings.channels[c.key]"
          @click="settings.channels[c.key] = !settings.channels[c.key]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5">
            <path d="M5 12.5 9.5 17 19 7.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </li>
    </ul>

    <div class="t-label" style="margin-top: 28px">발송 시점</div>
    <div class="tabs">
      <button
        type="button"
        :class="{ active: settings.when === 'NOW' }"
        @click="settings.when = 'NOW'"
      >
        즉시
      </button>
      <button
        type="button"
        :class="{ active: settings.when === 'SCHEDULED' }"
        @click="settings.when = 'SCHEDULED'"
      >
        예약 · <span class="mono">09.03 09:00</span>
      </button>
    </div>

    <div class="remind">
      <span
        >미이수 시 자동 재발송
        <span class="mono t-small" style="margin-left: 6px">D-7 · D-3</span></span
      >
      <button
        type="button"
        class="switch"
        :class="{ 'switch--on': settings.remind }"
        :aria-pressed="settings.remind"
        @click="settings.remind = !settings.remind"
      >
        <i />
      </button>
    </div>

    <div class="t-label" style="margin-top: 28px">미리보기 — 사내 메일</div>
    <div class="preview">
      <div class="preview__meta t-small">
        <span>{{ preview.to }}</span
        ><span class="mono">09.02 09:20</span>
      </div>
      <div class="preview__subject">{{ preview.subject }}</div>
      <p class="preview__body">{{ preview.body }}</p>
      <span class="preview__cta">수강신청</span>
    </div>

    <div class="stats">
      <div>
        <div class="t-label">대상</div>
        <div class="num">{{ total }}</div>
      </div>
      <div>
        <div class="t-label">메일</div>
        <div class="num">{{ settings.channels.mail ? total : 0 }}</div>
      </div>
      <div>
        <div class="t-label">메신저</div>
        <div class="num">{{ settings.channels.messenger ? total : 0 }}</div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.settings {
  border-left: 1px solid var(--line);
  padding-left: 48px;
  display: flex;
  flex-direction: column;
  height: 100%;
}
.rows {
  list-style: none;
  margin: 10px 0 0;
  padding: 0;
  border-top: 1px solid var(--line-strong);
}
.rows li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40px;
  border-bottom: 1px solid var(--line);
  font-size: 13px;
}
.check {
  width: 18px;
  height: 18px;
  padding: 0;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius);
  background: var(--surface);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.check svg {
  width: 11px;
  height: 11px;
  opacity: 0;
}
.check--on {
  background: var(--sk-red);
  border-color: var(--sk-red);
}
.check--on svg {
  opacity: 1;
}
.switch {
  width: 38px;
  height: 20px;
  padding: 0;
  border: 1px solid var(--line-strong);
  border-radius: 10px;
  background: var(--surface-muted);
  cursor: pointer;
  position: relative;
  transition: background 0.18s ease;
}
.switch i {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--ink-400);
  transition:
    left 0.18s ease,
    background 0.18s ease;
}
.switch--on {
  background: var(--sk-red);
  border-color: var(--sk-red);
}
.switch--on i {
  left: 20px;
  background: #fff;
}
.tabs {
  display: flex;
  gap: 24px;
  margin-top: 10px;
  border-bottom: 1px solid var(--line);
  font-size: 13px;
}
.tabs button {
  background: none;
  border: 0;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  padding: 0 0 10px;
  font: inherit;
  color: var(--ink-600);
  cursor: pointer;
}
.tabs button.active {
  color: var(--ink-900);
  font-weight: 600;
  border-bottom-color: var(--ink-900);
}
.remind {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40px;
  margin-top: 16px;
  border-bottom: 1px solid var(--line);
  font-size: 13px;
}
.preview {
  margin-top: 10px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface);
  padding: 16px;
}
.preview__meta {
  display: flex;
  justify-content: space-between;
}
.preview__subject {
  margin-top: 10px;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
}
.preview__body {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--ink-600);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.preview__cta {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 12px;
  margin-top: 12px;
  background: var(--sk-red);
  border-radius: var(--radius);
  font-size: 12px;
  font-weight: 600;
  color: #fff;
}
.stats {
  margin-top: auto;
  padding-top: 24px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
.stats .num {
  font-size: 20px;
  font-weight: 500;
  letter-spacing: -0.02em;
  margin-top: 4px;
}
</style>
