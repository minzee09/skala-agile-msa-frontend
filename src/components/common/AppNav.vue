<script setup>
import BrandMark from './BrandMark.vue'

defineProps({
  sectionLabel: { type: String, required: true },
  /** [{ label, to, badge?, dot?, tag? }] */
  items: { type: Array, required: true },
  user: { type: Object, default: null },
})
defineEmits(['logout'])
</script>

<template>
  <nav class="nav">
    <RouterLink :to="{ name: 'start' }" class="brand">
      <BrandMark :size="30" />
      <span class="brand__name">법정의무교육 통합관리</span>
    </RouterLink>

    <div class="nav__body">
      <div class="t-label nav__section">{{ sectionLabel }}</div>

      <ul class="nav__list">
        <li v-for="item in items" :key="item.label">
          <RouterLink :to="item.to" class="nav__item" exact-active-class="nav__item--active">
            <span>{{ item.label }}</span>
            <span v-if="item.badge" class="num nav__badge">{{ item.badge }}</span>
            <span v-else-if="item.tag" class="nav__tag">{{ item.tag }}</span>
            <span v-else-if="item.dot" class="nav__dot" />
          </RouterLink>
        </li>
      </ul>
    </div>

    <div v-if="user" class="nav__user">
      <div class="nav__user-name">{{ user.name }}</div>
      <div class="t-small">{{ user.sub }}</div>
      <button type="button" class="nav__logout" @click="$emit('logout')">로그아웃</button>
    </div>
  </nav>
</template>

<style scoped>
.nav {
  width: var(--nav-width);
  flex-shrink: 0;
  border-right: 1px solid var(--line);
  padding: 32px 0 28px;
  display: flex;
  flex-direction: column;
  height: 100vh;
  min-height: 0;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 100;
  overflow: hidden;
  background: var(--paper);
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 28px;
  border: 0;
  flex-shrink: 0;
}
.brand__name {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
  word-break: keep-all;
}
.nav__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding-bottom: 24px;
  scrollbar-width: thin;
  scrollbar-color: var(--line-strong) transparent;
}

.nav__section {
  padding: 0 28px;
  margin-top: 48px;
}
.nav__list {
  list-style: none;
  margin: 10px 0 0;
  padding: 0;
}
.nav__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40px;
  padding: 0 28px 0 26px;
  border: 0;
  border-left: 2px solid transparent;
  font-size: 14px;
  color: var(--ink-600);
}
.nav__item:hover {
  color: var(--ink-900);
}
.nav__item--active {
  border-left-color: var(--sk-red);
  color: var(--ink-900);
  font-weight: 600;
}
.nav__badge {
  font-size: 12px;
  font-weight: 500;
  color: var(--sk-red-text);
}
.nav__tag {
  padding: 1px 5px;
  background: var(--sk-teal-tint);
  color: var(--sk-teal);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
}
.nav__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--sk-red);
}
.nav__user {
  flex-shrink: 0;
  padding: 20px 28px 0;
  border-top: 1px solid var(--line);
  background: var(--paper);
}
.nav__user-name {
  font-size: 13px;
  font-weight: 500;
}
.nav__logout {
  margin-top: 10px;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  font-size: 12px;
  color: var(--ink-400);
  cursor: pointer;
}
.nav__logout:hover {
  color: var(--sk-red);
}
</style>
