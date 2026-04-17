<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { apiFetch } from '../api/http'

type UserRow = { id: string; fullName: string; email: string | null; role: string; status: string }

const rows = ref<UserRow[]>([])
const error = ref('')

async function load() {
  error.value = ''
  try {
    rows.value = await apiFetch<UserRow[]>('/admin/users')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Ошибка'
  }
}

async function setRole(id: string, role: string) {
  await apiFetch(`/admin/users/${id}/role`, { method: 'PUT', json: { role } })
  await load()
}

async function setStatus(id: string, status: string) {
  await apiFetch(`/admin/users/${id}/status`, { method: 'PUT', json: { status } })
  await load()
}

onMounted(load)
</script>

<template>
  <section>
    <h1>Пользователи</h1>
    <p v-if="error" class="err">{{ error }}</p>
    <button type="button" class="ghost" @click="load">Обновить</button>
    <table>
      <thead>
        <tr>
          <th>Имя</th>
          <th>Email</th>
          <th>Роль</th>
          <th>Статус</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="u in rows" :key="u.id">
          <td>{{ u.fullName }}</td>
          <td>{{ u.email }}</td>
          <td>
            <select :value="u.role" @change="setRole(u.id, ($event.target as HTMLSelectElement).value)">
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </td>
          <td>
            <select :value="u.status" @change="setStatus(u.id, ($event.target as HTMLSelectElement).value)">
              <option value="ACTIVE">ACTIVE</option>
              <option value="BLOCKED">BLOCKED</option>
              <option value="DELETED">DELETED</option>
            </select>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<style scoped>
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;
  font-size: 13px;
}
th,
td {
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding: 8px;
  text-align: left;
}
.err {
  color: #fca5a5;
}
.ghost {
  margin-top: 8px;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: transparent;
  color: inherit;
  cursor: pointer;
}
</style>
