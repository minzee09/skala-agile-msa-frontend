<script setup>
defineProps({
  title: { type: String, required: true },
})
</script>

<template>
  <header class="page-header anim-up">
    <div>
      <h1 class="t-h1 page-header__title">{{ title }}</h1>
      <div v-if="$slots.subtitle" class="t-small page-header__sub"><slot name="subtitle" /></div>
    </div>
    <div v-if="$slots.actions" class="page-header__actions"><slot name="actions" /></div>
  </header>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  min-height: 56px;
}
.page-header__title {
  margin: 0;
}
.page-header__sub {
  margin-top: 6px;
}
.page-header__actions {
  display: flex;
  gap: 8px;
}
</style>
