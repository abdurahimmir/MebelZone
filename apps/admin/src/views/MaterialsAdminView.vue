<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { apiFetch } from '../api/http'

const rows = ref<unknown[]>([])
const title = ref('Новый материал')
const category = ref('LDSP')
const thicknessMm = ref(16)
const sheetW = ref(2800)
const sheetH = ref(2070)
const price = ref(40)

async function load() {
  rows.value = (await apiFetch('/admin/materials')) as unknown[]
}

async function create() {
  await apiFetch('/admin/materials', {
    method: 'POST',
    json: {
      category: category.value,
      title: title.value,
      thicknessMm: thicknessMm.value,
      sheetWidthMm: sheetW.value,
      sheetHeightMm: sheetH.value,
      pricePerSheet: price.value,
      isActive: true,
    },
  })
  await load()
}

onMounted(load)
</script>

<template>
  <section>
    <h1>Материалы</h1>
    <div class="form">
      <input v-model="title" placeholder="Название" />
      <input v-model="category" placeholder="Категория" />
      <input v-model.number="thicknessMm" type="number" />
      <input v-model.number="sheetW" type="number" />
      <input v-model.number="sheetH" type="number" />
      <input v-model.number="price" type="number" step="0.01" />
      <button type="button" @click="create">Добавить</button>
    </div>
    <pre class="pre">{{ JSON.stringify(rows, null, 2) }}</pre>
  </section>
</template>

<style scoped>
.form {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 12px 0;
}
input {
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(0, 0, 0, 0.35);
  color: inherit;
}
button {
  padding: 6px 10px;
  border-radius: 6px;
  border: none;
  background: #7c3aed;
  color: #fff;
  cursor: pointer;
}
.pre {
  font-size: 11px;
  overflow: auto;
  max-height: 55vh;
  background: rgba(0, 0, 0, 0.35);
  padding: 10px;
  border-radius: 8px;
}
</style>
