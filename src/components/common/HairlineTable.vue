<script setup>
/**
 * 헤어라인 표. columns: [{ key, label, width, align }], rows: object[].
 * 셀 커스터마이징은 #cell-<key> 슬롯으로, 행 강조는 rowClass 로.
 */
defineProps({
  columns: { type: Array, required: true },
  rows: { type: Array, required: true },
  rowKey: { type: String, default: 'id' },
  rowHeight: { type: Number, default: 44 },
  rowClass: { type: Function, default: () => '' },
})

const template = (columns) => columns.map((c) => c.width ?? 'minmax(0, 1fr)').join(' ')
</script>

<template>
  <div class="table">
    <div class="table__head" :style="{ gridTemplateColumns: template(columns) }">
      <div v-for="c in columns" :key="c.key" :style="{ textAlign: c.align ?? 'left' }">
        {{ c.label }}
      </div>
    </div>
    <div
      v-for="row in rows"
      :key="row[rowKey]"
      class="table__row"
      :class="rowClass(row)"
      :style="{ gridTemplateColumns: template(columns), height: `${rowHeight}px` }"
    >
      <div v-for="c in columns" :key="c.key" :style="{ textAlign: c.align ?? 'left' }">
        <slot :name="`cell-${c.key}`" :row="row">{{ row[c.key] }}</slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
.table__head {
  display: grid;
  align-items: center;
  height: 24px;
  border-bottom: 1px solid var(--line-strong);
  font-size: 11px;
  color: var(--ink-400);
  letter-spacing: 0.02em;
}
.table__row {
  display: grid;
  align-items: center;
  border-bottom: 1px solid var(--line);
  font-size: 13px;
}
.table__row--highlight {
  background: var(--sk-red-tint);
  margin: 0 -12px;
  padding: 0 12px;
}
</style>
