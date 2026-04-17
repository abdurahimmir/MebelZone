<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const isLogin = computed(() => route.name === 'login')

async function logout() {
  await auth.logout()
  await router.push({ name: 'login' })
}
</script>

<template>
  <div v-if="isLogin" class="login-wrap">
    <RouterView />
  </div>
  <div v-else class="shell">
    <aside class="sidebar">
      <div class="logo">Furniture Admin</div>
      <nav>
        <RouterLink to="/">Dashboard</RouterLink>
        <RouterLink to="/users">Пользователи</RouterLink>
        <RouterLink to="/projects">Проекты</RouterLink>
        <RouterLink to="/materials">Материалы</RouterLink>
        <RouterLink to="/textures">Текстуры</RouterLink>
        <RouterLink to="/hardware">Фурнитура</RouterLink>
        <RouterLink to="/profiles">Профили</RouterLink>
        <RouterLink to="/tariffs">Тарифы</RouterLink>
        <RouterLink to="/settings">Настройки</RouterLink>
      </nav>
      <button type="button" class="logout" @click="logout">Выйти</button>
    </aside>

    <section class="content">
      <RouterView />
    </section>
  </div>
</template>

<style scoped>
.login-wrap {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
}

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
  display: flex;
  flex-direction: column;
}

.logo {
  font-weight: 700;
  letter-spacing: -0.02em;
  padding: 10px 10px 16px;
}

nav {
  display: grid;
  gap: 4px;
  flex: 1;
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

.logout {
  margin-top: 16px;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.content {
  padding: 22px;
  max-width: 1200px;
}
</style>
