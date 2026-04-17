<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { apiFetch } from '../api/http'

const stats = ref<{ users: number; projects: number; renders: number; exports: number } | null>(
  null,
)

onMounted(async () => {
  stats.value = await apiFetch('/admin/dashboard')
})
</script>

<template>
  <section>
    <h1>Dashboard</h1>
    <div v-if="stats" class="grid">
      <div class="tile"><span>Пользователи</span><strong>{{ stats.users }}</strong></div>
      <div class="tile"><span>Проекты</span><strong>{{ stats.projects }}</strong></div>
      <div class="tile"><span>Рендеры</span><strong>{{ stats.renders }}</strong></div>
      <div class="tile"><span>Экспорты</span><strong>{{ stats.exports }}</strong></div>
    </div>
    <p v-else class="muted">Загрузка…</p>
  </section>
</template>

<style scoped>
h1 {
  margin-top: 0;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}
.tile {
  padding: 14px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: grid;
  gap: 6px;
}
strong {
  font-size: 22px;
}
.muted {
  color: rgba(255, 255, 255, 0.55);
}
</style>
