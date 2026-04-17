<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')

async function submit() {
  error.value = ''
  try {
    await auth.loginEmail(email.value, password.value)
    await router.push('/projects')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Ошибка входа'
  }
}
</script>

<template>
  <div class="card">
    <h1>Вход</h1>
    <form class="form" @submit.prevent="submit">
      <label>
        Email
        <input v-model="email" type="email" required autocomplete="username" />
      </label>
      <label>
        Пароль
        <input v-model="password" type="password" required autocomplete="current-password" />
      </label>
      <p v-if="error" class="error">{{ error }}</p>
      <button type="submit" :disabled="auth.loading">Войти</button>
    </form>
    <p class="muted">
      Нет аккаунта?
      <RouterLink to="/register">Регистрация</RouterLink>
    </p>
  </div>
</template>

<style scoped>
.card {
  max-width: 420px;
  margin: 0 auto;
  padding: 24px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
}

h1 {
  margin: 0 0 16px;
  font-size: 22px;
}

.form {
  display: grid;
  gap: 14px;
}

label {
  display: grid;
  gap: 6px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.75);
}

input {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(0, 0, 0, 0.35);
  color: inherit;
}

button {
  padding: 10px 14px;
  border-radius: 10px;
  border: none;
  background: #3b82f6;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error {
  color: #fca5a5;
  margin: 0;
  font-size: 14px;
}

.muted {
  margin-top: 16px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
}

a {
  color: #93c5fd;
}
</style>
