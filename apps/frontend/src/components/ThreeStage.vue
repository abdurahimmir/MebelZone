<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import * as THREE from 'three'

const canvasRef = ref<HTMLCanvasElement | null>(null)

let renderer: THREE.WebGLRenderer | null = null
let frameId = 0

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return

  const width = canvas.clientWidth
  const height = canvas.clientHeight

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0b1220)

  const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100)
  camera.position.set(2.2, 1.6, 2.6)
  camera.lookAt(0, 0.35, 0)

  const hemi = new THREE.HemisphereLight(0xffffff, 0x223344, 1.1)
  scene.add(hemi)

  const dir = new THREE.DirectionalLight(0xffffff, 0.9)
  dir.position.set(3, 4, 2)
  scene.add(dir)

  const geo = new THREE.BoxGeometry(1, 1, 1)
  const mat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.35, metalness: 0.05 })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.y = 0.5
  scene.add(mesh)

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(width, height, false)

  const clock = new THREE.Clock()
  const tick = () => {
    const t = clock.getElapsedTime()
    mesh.rotation.y = t * 0.6
    mesh.rotation.x = t * 0.25
    renderer?.render(scene, camera)
    frameId = window.requestAnimationFrame(tick)
  }
  tick()
})

onBeforeUnmount(() => {
  window.cancelAnimationFrame(frameId)
  renderer?.dispose()
  renderer = null
})
</script>

<template>
  <canvas ref="canvasRef" class="stage" width="900" height="520" />
</template>

<style scoped>
.stage {
  width: 100%;
  height: 520px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
}
</style>
