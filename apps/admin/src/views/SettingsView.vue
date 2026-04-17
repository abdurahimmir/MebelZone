<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { apiFetch } from '../api/http'

const rows = ref<{ key: string; valueJson: unknown }[]>([])
const key = ref('auth.email.enabled')
const val = ref(true)

async function load() {
  rows.value = await apiFetch('/admin/settings')
}

async function save() {
  await apiFetch('/admin/settings', {
    method: 'POST',
    json: { key: key.value, valueJson: val.value },
  })
  await load()
}

onMounted(load)
</script>

<template>
  <section>
    <h1>Системные настройки</h1>
    <ul>
      <li v-for="r in rows" :key="r.key"><code>{{ r.key }}</code> → {{ JSON.stringify(r.valueJson) }}</li>
    </ul>
    <div class="row">
      <select v-model="key">
        <option value="auth.email.enabled">auth.email.enabled</option>
        <option value="auth.phone.enabled">auth.phone.enabled</option>
        <option value="auth.google.enabled">auth.google.enabled</option>
      </select>
      <label><input v-model="val" type="checkbox" /> включено</label>
      <button type="button" @click="save">Сохранить</button>
    </div>
  </section>
</template>

<style scoped>
ul {
  font-size: 13px;
}
.row {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 12px;
}
select,
button {
  padding: 8px 10px;
  border-radius: 8px;
}
button {
  border: none;
  background: #7c3aed;
  color: #fff;
  cursor: pointer;
}
</style>
