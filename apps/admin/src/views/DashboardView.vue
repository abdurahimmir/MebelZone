<script setup lang="ts">
import { useAppStore } from '../stores/app'

const app = useAppStore()
</script>

<template>
  <section class="panel">
    <p class="eyebrow">Этап 1 · админ-панель</p>
    <h1>{{ app.appName }}</h1>
    <p class="lead">
      Отдельное приложение для управления пользователями, справочниками, тарифами и системными настройками. На этом
      этапе подготовлен каркас: Router, Pinia и базовый layout.
    </p>

    <div class="card">
      <div class="card-title">Подключение к API</div>
      <code>{{ app.apiBaseUrl }}</code>
    </div>
  </section>
</template>

<style scoped>
.panel h1 {
  margin: 10px 0 12px;
  font-size: clamp(24px, 2.4vw, 34px);
  letter-spacing: -0.02em;
}

.lead {
  margin: 0 0 18px;
  color: rgba(255, 255, 255, 0.78);
  line-height: 1.55;
  max-width: 78ch;
}

.eyebrow {
  margin: 0;
  color: rgba(255, 255, 255, 0.55);
  font-size: 13px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.card {
  margin-top: 18px;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
}

.card-title {
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.55);
  margin-bottom: 10px;
}

code {
  font-size: 13px;
  padding: 6px 10px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: inline-block;
}
</style>
