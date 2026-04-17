<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { apiFetch } from '../api/http'

type ProjectRow = {
  id: string
  title: string
  status: string
  updatedAt: string
}

const router = useRouter()
const projects = ref<ProjectRow[]>([])
const loading = ref(true)
const error = ref('')
const title = ref('Новый проект')

async function load() {
  loading.value = true
  error.value = ''
  try {
    projects.value = await apiFetch<ProjectRow[]>('/projects')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Ошибка загрузки'
  } finally {
    loading.value = false
  }
}

async function create() {
  error.value = ''
  try {
    const p = await apiFetch<ProjectRow>('/projects', {
      method: 'POST',
      json: { title: title.value || 'Новый проект' },
    })
    await router.push(`/editor/${p.id}`)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось создать проект'
  }
}

onMounted(load)
</script>

<template>
  <section>
    <header class="head">
      <div>
        <h1>Проекты</h1>
        <p class="lead">Создавайте проекты и открывайте конструктор.</p>
      </div>
      <div class="create">
        <input v-model="title" placeholder="Название проекта" />
        <button type="button" @click="create">Создать</button>
        <button type="button" class="ghost" @click="load">Обновить</button>
      </div>
    </header>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="loading" class="muted">Загрузка…</p>

    <ul v-else class="list">
      <li v-for="p in projects" :key="p.id">
        <RouterLink :to="`/editor/${p.id}`" class="link">
          <span class="t">{{ p.title }}</span>
          <span class="meta">{{ p.status }} · {{ new Date(p.updatedAt).toLocaleString() }}</span>
        </RouterLink>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.head {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 18px;
}

h1 {
  margin: 0 0 6px;
}

.lead {
  margin: 0;
  color: rgba(255, 255, 255, 0.72);
}

.create {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

input {
  min-width: 220px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(0, 0, 0, 0.35);
  color: inherit;
}

button {
  padding: 10px 14px;
  border-radius: 10px;
  border: none;
  background: #3b82f6;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}

button.ghost {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.9);
}

.list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 10px;
}

li {
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
}

.link {
  display: grid;
  gap: 4px;
  padding: 14px 16px;
  color: inherit;
  text-decoration: none;
}

.t {
  font-weight: 600;
}

.meta {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.55);
}

.error {
  color: #fca5a5;
}

.muted {
  color: rgba(255, 255, 255, 0.55);
}
</style>
