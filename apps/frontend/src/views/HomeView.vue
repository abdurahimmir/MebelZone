<script setup lang="ts">
import ThreeStage from '../components/ThreeStage.vue'
import { useAppStore } from '../stores/app'

const app = useAppStore()
</script>

<template>
  <section class="hero">
    <div class="copy">
      <p class="eyebrow">Этап 1 · подготовка проекта</p>
      <h1>{{ app.appName }}</h1>
      <p class="lead">
        Полноэкранный конструктор мебели: здесь будет редактор, вьюпорты и расчёты. Сейчас зафиксированы
        каркас приложения, Pinia, Router и демо-сцена Three.js.
      </p>
      <dl class="facts">
        <div>
          <dt>API</dt>
          <dd>
            <code>{{ app.apiBaseUrl }}</code>
          </dd>
        </div>
      </dl>
    </div>

    <div class="preview">
      <ThreeStage />
    </div>
  </section>
</template>

<style scoped>
.hero {
  display: grid;
  gap: 28px;
  grid-template-columns: 1.05fr 1.35fr;
  align-items: start;
}

@media (max-width: 980px) {
  .hero {
    grid-template-columns: 1fr;
  }
}

.copy h1 {
  margin: 10px 0 12px;
  font-size: clamp(28px, 3vw, 40px);
  letter-spacing: -0.02em;
}

.lead {
  margin: 0 0 18px;
  color: rgba(255, 255, 255, 0.78);
  line-height: 1.55;
  max-width: 62ch;
}

.eyebrow {
  margin: 0;
  color: rgba(255, 255, 255, 0.55);
  font-size: 13px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.facts {
  margin: 0;
  display: grid;
  gap: 10px;
}

.facts dt {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.55);
}

.facts dd {
  margin: 4px 0 0;
}

code {
  font-size: 13px;
  padding: 6px 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
</style>
