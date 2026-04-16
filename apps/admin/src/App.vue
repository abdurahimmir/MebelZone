<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="shell">
    <aside class="sidebar">
      <div class="logo">Admin</div>
      <nav>
        <RouterLink to="/">Dashboard</RouterLink>
      </nav>
    </aside>

    <section class="content">
      <RouterView />
    </section>
  </div>
</template>

<style scoped>
.shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 260px 1fr;
}

@media (max-width: 900px) {
  .shell {
    grid-template-columns: 1fr;
  }
}

.sidebar {
  padding: 18px 16px;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.25);
}

.logo {
  font-weight: 700;
  letter-spacing: -0.02em;
  padding: 10px 10px 16px;
}

nav a {
  display: block;
  padding: 10px 10px;
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.86);
  text-decoration: none;
}

nav a.router-link-active {
  background: rgba(255, 255, 255, 0.08);
}

.content {
  padding: 22px;
  max-width: 1100px;
}
</style>
