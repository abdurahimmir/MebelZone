<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { apiFetch } from '../api/http'

const rows = ref<unknown[]>([])

onMounted(async () => {
  rows.value = (await apiFetch('/admin/projects')) as unknown[]
})
</script>

<template>
  <section>
    <h1>Проекты</h1>
    <pre class="pre">{{ JSON.stringify(rows, null, 2) }}</pre>
  </section>
</template>

<style scoped>
.pre {
  font-size: 11px;
  overflow: auto;
  max-height: 70vh;
  background: rgba(0, 0, 0, 0.35);
  padding: 10px;
  border-radius: 8px;
}
</style>
