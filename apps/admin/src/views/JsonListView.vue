<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { apiFetch } from '../api/http'

const props = defineProps<{ title: string; path: string }>()
const data = ref<unknown>(null)

onMounted(async () => {
  data.value = await apiFetch(props.path)
})
</script>

<template>
  <section>
    <h1>{{ title }}</h1>
    <pre class="pre">{{ JSON.stringify(data, null, 2) }}</pre>
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
