<script setup>
import HairlineTile from '@/components/common/HairlineTile.vue'
import { fmtDate } from '@/utils/date'

/** people: useScreeningStore().peopleRows (앞 3명), dday: 'D-12' */
defineProps({
  people: { type: Array, required: true },
  dday: { type: String, required: true },
})
</script>

<template>
  <div class="tiles">
    <HairlineTile v-for="p in people" :key="p.userId">
      <div class="tile__top">
        <span class="tile__name">{{ p.name }}</span>
        <span class="num tile__dday">{{ dday }}</span>
      </div>
      <div class="t-small tile__line" style="color: var(--ink-600)">{{ p.dept }} · {{ p.job }}</div>
      <div class="t-small tile__line">
        <template v-if="p.lastTraining"
          ><span class="mono">{{ fmtDate(p.lastTraining) }}</span> 만료</template
        >
        <template v-else>이력 없음</template>
        · <span class="mono">{{ p.employeeNo }}</span>
      </div>
    </HairlineTile>
  </div>
</template>

<style scoped>
.tiles {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}
.tile__top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}
.tile__name {
  font-size: 15px;
  font-weight: 600;
}
.tile__dday {
  font-size: 12px;
  font-weight: 600;
  color: var(--sk-red-text);
}
.tile__line {
  margin-top: 8px;
}
.tile__line + .tile__line {
  margin-top: 6px;
}
</style>
