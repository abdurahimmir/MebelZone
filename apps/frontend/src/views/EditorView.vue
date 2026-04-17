<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiFetch, getAccessToken } from '../api/http'
import { fetchAuthorizedBlob } from '../api/download'
import ThreeEditor, { type EditorItem } from '../components/ThreeEditor.vue'

type ProjectDetail = {
  id: string
  title: string
  items: EditorItem[]
}

type BackgroundJob = {
  id: string
  status: string
  kind?: string
  payloadJson?: { renderJobId?: string } | null
  error?: string | null
}

const route = useRoute()
const router = useRouter()
const project = ref<ProjectDetail | null>(null)
const loading = ref(true)
const error = ref('')
const busy = ref(false)
const calcResult = ref<unknown>(null)
const previewUrl = ref<string | null>(null)

const panelW = ref(800)
const panelH = ref(2000)
const panelT = ref(18)

const items = computed(() => project.value?.items ?? [])

async function load() {
  loading.value = true
  error.value = ''
  try {
    const id = route.params.id as string
    project.value = await apiFetch<ProjectDetail>(`/projects/${id}`)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Ошибка'
  } finally {
    loading.value = false
  }
}

function defaultGeometry() {
  return { type: 'box' }
}

function defaultTransform() {
  return { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] }
}

async function saveAll() {
  if (!project.value) return
  busy.value = true
  try {
    await apiFetch(`/projects/${project.value.id}/save`, {
      method: 'POST',
      json: {
        items: project.value.items.map((it) => ({
          itemType: it.itemType,
          geometryJson: (it as { geometryJson?: unknown }).geometryJson ?? defaultGeometry(),
          transformJson: (it as { transformJson?: unknown }).transformJson ?? defaultTransform(),
          dimensionJson: (it as { dimensionJson?: unknown }).dimensionJson ?? {},
        })),
      },
    })
  } finally {
    busy.value = false
  }
}

async function addPanel() {
  if (!project.value) return
  const newItem: EditorItem & {
    geometryJson: unknown
    transformJson: unknown
    dimensionJson: unknown
  } = {
    id: crypto.randomUUID(),
    itemType: 'panel',
    geometryJson: defaultGeometry(),
    transformJson: defaultTransform(),
    dimensionJson: {
      widthMm: panelW.value,
      heightMm: panelH.value,
      thicknessMm: panelT.value,
    },
  }
  project.value.items = [...project.value.items, newItem]
  await saveAll()
}

async function runCalc() {
  if (!project.value) return
  busy.value = true
  try {
    calcResult.value = await apiFetch(`/projects/${project.value.id}/calculate`, {
      method: 'POST',
    })
  } finally {
    busy.value = false
  }
}

function baseUrl(): string {
  return (import.meta.env.VITE_API_BASE_URL as string).replace(/\/$/, '')
}

async function pollBackgroundJob(projectId: string, jobId: string): Promise<BackgroundJob> {
  const deadline = Date.now() + 60_000
  while (Date.now() < deadline) {
    const job = await apiFetch<BackgroundJob>(`/projects/${projectId}/jobs/${jobId}`)
    if (job.status === 'COMPLETED' || job.status === 'FAILED') {
      return job
    }
    await new Promise((r) => setTimeout(r, 400))
  }
  throw new Error('Timeout waiting for background job')
}

async function downloadJobFile(projectId: string, jobId: string, filename: string) {
  const url = `${baseUrl()}/projects/${projectId}/jobs/${jobId}/download`
  const headers = new Headers()
  const token = getAccessToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const res = await fetch(url, { method: 'GET', headers })
  if (!res.ok) throw new Error(await res.text())
  const blob = await res.blob()
  const href = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  a.click()
  URL.revokeObjectURL(href)
}

async function exportFmt(kind: 'json' | 'pdf' | 'dxf' | 'internal') {
  if (!project.value) return
  busy.value = true
  try {
    const enq = await apiFetch<{ backgroundJobId: string }>(
      `/projects/${project.value.id}/export/${kind}`,
      { method: 'POST' },
    )
    const job = await pollBackgroundJob(project.value.id, enq.backgroundJobId)
    if (job.status === 'FAILED') {
      throw new Error(job.error || 'Export failed')
    }
    const ext =
      kind === 'internal' ? 'fproj.json' : kind === 'pdf' ? 'pdf' : kind === 'dxf' ? 'dxf' : 'json'
    await downloadJobFile(project.value.id, job.id, `project-${project.value.id}.${ext}`)
  } finally {
    busy.value = false
  }
}

async function renderPrev() {
  if (!project.value) return
  busy.value = true
  previewUrl.value = null
  try {
    const enq = await apiFetch<{ backgroundJobId: string }>(
      `/projects/${project.value.id}/render-preview`,
      { method: 'POST' },
    )
    const job = await pollBackgroundJob(project.value.id, enq.backgroundJobId)
    if (job.status === 'FAILED') {
      throw new Error(job.error || 'Render failed')
    }
    const renderJobId = job.payloadJson?.renderJobId
    if (!renderJobId) throw new Error('Missing render job id')
    previewUrl.value = await fetchAuthorizedBlob(
      `/projects/${project.value.id}/render-preview/${renderJobId}`,
    )
  } finally {
    busy.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="layout" v-if="project">
    <aside class="left">
      <button class="back" type="button" @click="router.push('/projects')">← Проекты</button>
      <h2>{{ project.title }}</h2>
      <p class="muted">
        Экспорт и превью выполняются в фоне (BullMQ); после готовности файл скачивается автоматически.
      </p>

      <div class="block">
        <h3>Новая панель</h3>
        <div class="grid3">
          <label>Ширина мм <input v-model.number="panelW" type="number" min="1" /></label>
          <label>Высота мм <input v-model.number="panelH" type="number" min="1" /></label>
          <label>Толщина мм <input v-model.number="panelT" type="number" min="1" /></label>
        </div>
        <button type="button" @click="addPanel" :disabled="busy">Добавить панель</button>
      </div>

      <div class="block">
        <h3>Панели ({{ items.filter((i) => i.itemType === 'panel').length }})</h3>
        <ul class="mini">
          <li v-for="it in items" :key="it.id">{{ it.itemType }} · {{ (it as { id: string }).id.slice(0, 8) }}</li>
        </ul>
      </div>
    </aside>

    <main class="center">
      <ThreeEditor :items="items" />
    </main>

    <aside class="right">
      <div class="toolbar">
        <button :disabled="busy" @click="saveAll">Сохранить</button>
        <button :disabled="busy" @click="runCalc">Расчёт</button>
        <button :disabled="busy" @click="renderPrev">Рендер</button>
      </div>
      <div class="toolbar">
        <button :disabled="busy" @click="exportFmt('json')">JSON</button>
        <button :disabled="busy" @click="exportFmt('pdf')">PDF</button>
        <button :disabled="busy" @click="exportFmt('dxf')">DXF</button>
        <button :disabled="busy" @click="exportFmt('internal')">Внутр.</button>
      </div>
      <div v-if="calcResult" class="prewrap">
        <h3>Последний расчёт</h3>
        <pre>{{ JSON.stringify(calcResult, null, 2) }}</pre>
      </div>
      <div v-if="previewUrl" class="preview">
        <h3>Превью</h3>
        <img :src="previewUrl" alt="preview" />
      </div>
    </aside>
  </div>
  <p v-else-if="loading" class="muted pad">Загрузка редактора…</p>
  <p v-else class="error pad">{{ error }}</p>
</template>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 260px 1fr 300px;
  gap: 16px;
  align-items: start;
}

@media (max-width: 1100px) {
  .layout {
    grid-template-columns: 1fr;
  }
}

.left,
.right {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.03);
}

.center {
  min-width: 0;
}

h2 {
  margin: 10px 0 8px;
  font-size: 18px;
}

h3 {
  margin: 0 0 8px;
  font-size: 14px;
}

.muted {
  color: rgba(255, 255, 255, 0.65);
  font-size: 13px;
  margin: 0 0 12px;
}

.block {
  margin-top: 14px;
  display: grid;
  gap: 10px;
}

.grid3 {
  display: grid;
  gap: 8px;
}

label {
  display: grid;
  gap: 4px;
  font-size: 12px;
}

input {
  padding: 8px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(0, 0, 0, 0.35);
  color: inherit;
}

button {
  padding: 8px 10px;
  border-radius: 8px;
  border: none;
  background: #3b82f6;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}

button:disabled {
  opacity: 0.55;
}

.back {
  background: rgba(255, 255, 255, 0.08);
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.mini {
  margin: 0;
  padding-left: 18px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.75);
}

.prewrap pre {
  font-size: 11px;
  overflow: auto;
  max-height: 240px;
  background: rgba(0, 0, 0, 0.35);
  padding: 8px;
  border-radius: 8px;
}

.preview img {
  max-width: 100%;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.pad {
  padding: 20px;
}

.error {
  color: #fca5a5;
}
</style>
