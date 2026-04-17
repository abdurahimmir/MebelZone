<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as THREE from 'three'

export type EditorItem = {
  id: string
  itemType: string
  dimensionJson: unknown
  transformJson: unknown
}

const props = defineProps<{
  items: EditorItem[]
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let frameId = 0
const meshes = new Map<string, THREE.Mesh>()

function readDim(json: unknown): { w: number; h: number; t: number } {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return { w: 0.8, h: 2, t: 0.018 }
  const o = json as Record<string, unknown>
  const w =
    Number(o.widthMm ?? o.width ?? 800) / 1000
  const h =
    Number(o.heightMm ?? o.height ?? 2000) / 1000
  const t =
    Number(o.thicknessMm ?? o.thickness ?? 18) / 1000
  return { w: w || 0.8, h: h || 2, t: t || 0.018 }
}

function readPos(json: unknown): [number, number, number] {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return [0, 0, 0]
  const o = json as Record<string, unknown>
  const p = o.position
  if (Array.isArray(p) && p.length >= 3) {
    return [Number(p[0]) || 0, Number(p[1]) || 0, Number(p[2]) || 0]
  }
  return [0, 0, 0]
}

function rebuildMeshes() {
  if (!scene) return
  for (const m of meshes.values()) {
    scene.remove(m)
    m.geometry.dispose()
    if (Array.isArray(m.material)) m.material.forEach((x) => x.dispose())
    else m.material.dispose()
  }
  meshes.clear()

  const panels = props.items.filter((i) => i.itemType === 'panel')
  for (const it of panels) {
    const { w, h, t } = readDim(it.dimensionJson)
    const [px, py, pz] = readPos(it.transformJson)
    const geo = new THREE.BoxGeometry(w, t, h)
    const mat = new THREE.MeshStandardMaterial({
      color: 0x60a5fa,
      roughness: 0.45,
      metalness: 0.05,
    })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(px, py + t / 2, pz)
    scene.add(mesh)
    meshes.set(it.id, mesh)
  }
}

function initScene() {
  const canvas = canvasRef.value
  if (!canvas) return

  const width = canvas.clientWidth
  const height = canvas.clientHeight

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0b1220)

  camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100)
  camera.position.set(3.2, 2.4, 3.6)
  camera.lookAt(0, 0.6, 0)

  const hemi = new THREE.HemisphereLight(0xffffff, 0x223344, 1.05)
  scene.add(hemi)
  const dir = new THREE.DirectionalLight(0xffffff, 0.85)
  dir.position.set(4, 6, 3)
  scene.add(dir)

  const grid = new THREE.GridHelper(10, 20, 0x334155, 0x1f2937)
  scene.add(grid)

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(width, height, false)

  rebuildMeshes()

  const clock = new THREE.Clock()
  const tick = () => {
    const t = clock.getElapsedTime()
    for (const mesh of meshes.values()) {
      mesh.rotation.y = t * 0.15
    }
    if (renderer && scene && camera) renderer.render(scene, camera)
    frameId = window.requestAnimationFrame(tick)
  }
  tick()
}

onMounted(initScene)

watch(
  () => props.items,
  () => {
    rebuildMeshes()
  },
  { deep: true },
)

onBeforeUnmount(() => {
  window.cancelAnimationFrame(frameId)
  if (scene) {
    for (const m of meshes.values()) {
      scene.remove(m)
      m.geometry.dispose()
      if (Array.isArray(m.material)) m.material.forEach((x) => x.dispose())
      else m.material.dispose()
    }
  }
  renderer?.dispose()
  renderer = null
  scene = null
  camera = null
})
</script>

<template>
  <canvas ref="canvasRef" class="stage" />
</template>

<style scoped>
.stage {
  width: 100%;
  height: min(62vh, 640px);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  display: block;
}
</style>
