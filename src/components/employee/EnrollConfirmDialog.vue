<script setup>
import { ref } from 'vue'
import { fmtDate } from '@/utils/date'

/** 수강신청 확인 — enrollment-service 호출, 백엔드가 결제(0원 정책은 화면 표기) → Kafka → ACTIVE */
const open = defineModel({ type: Boolean, default: false })
const props = defineProps({
  course: { type: Object, default: null },
  dday: { type: String, default: '' },
  onConfirm: { type: Function, required: true },
})
const submitting = ref(false)

async function confirm() {
  submitting.value = true
  try {
    await props.onConfirm(props.course)
    open.value = false
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <v-dialog v-model="open" width="480">
    <v-card v-if="course" class="card">
      <div class="card__head">
        <span class="card__title">수강신청 확인</span>
        <button type="button" class="card__close" @click="open = false">닫기</button>
      </div>

      <div class="t-label" style="margin-top: 24px">필수 · {{ course.law }}</div>
      <div class="card__course">{{ course.title }}</div>

      <ul class="rows">
        <li>
          <span class="t-muted">이수 시간</span
          ><span
            ><b class="num">{{ course.minutes }}</b
            >분</span
          >
        </li>
        <li>
          <span class="t-muted">이수 마감</span
          ><span class="mono" style="font-size: 12px"
            >{{ fmtDate(course.deadline) }}
            <b class="t-red" style="margin-left: 6px">{{ dday }}</b></span
          >
        </li>
        <li>
          <span class="t-muted">수강료 <span class="t-small">· 회사 부담</span></span
          ><span><b class="num" style="font-size: 15px">0</b>원</span>
        </li>
      </ul>

      <p class="t-small" style="margin: 16px 0 0; line-height: 1.55">
        신청 즉시 정산·확정되어 바로 수강할 수 있습니다.
      </p>

      <div class="card__actions">
        <v-btn variant="outlined" height="40" style="flex: 1" @click="open = false">취소</v-btn>
        <v-btn color="primary" height="40" style="flex: 2" :loading="submitting" @click="confirm"
          >신청 확정</v-btn
        >
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.card {
  padding: 32px;
}
.card__head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.card__title {
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.015em;
}
.card__close {
  border: 0;
  background: none;
  font: inherit;
  font-size: 12px;
  color: var(--ink-400);
  cursor: pointer;
}
.card__course {
  margin-top: 6px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.015em;
  line-height: 1.35;
}
.rows {
  list-style: none;
  margin: 24px 0 0;
  padding: 0;
  border-top: 1px solid var(--line-strong);
}
.rows li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 36px;
  border-bottom: 1px solid var(--line);
  font-size: 13px;
}
.rows li:last-child {
  border-bottom-color: var(--line-strong);
}
.rows b {
  font-weight: 500;
}
.card__actions {
  display: flex;
  gap: 8px;
  margin-top: 28px;
}
</style>
