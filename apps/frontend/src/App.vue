<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <div class="brand">Furniture Constructor</div>
      <nav class="nav">
        <RouterLink to="/">Главная</RouterLink>
      </nav>
    </header>

    <main class="main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 22px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  position: sticky;
  top: 0;
  z-index: 10;
}

.brand {
  font-weight: 650;
  letter-spacing: -0.01em;
}

.nav a {
  color: rgba(255, 255, 255, 0.86);
  text-decoration: none;
  padding: 8px 10px;
  border-radius: 10px;
}

.nav a.router-link-active {
  background: rgba(255, 255, 255, 0.08);
}

.main {
  flex: 1;
  padding: 28px 22px 40px;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
}
</style>
