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
    await auth.login(email.value, password.value)
    if (!auth.isAdmin) {
      error.value = 'Нужна роль администратора'
      await auth.logout()
      return
    }
    await router.push('/')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Ошибка'
  }
}
</script>

<template>
  <div class="card">
    <h1>Админ · вход</h1>
    <form @submit.prevent="submit" class="form">
      <label>Email <input v-model="email" type="email" required /></label>
      <label>Пароль <input v-model="password" type="password" required /></label>
      <p v-if="error" class="err">{{ error }}</p>
      <button type="submit" :disabled="auth.loading">Войти</button>
    </form>
  </div>
</template>

<style scoped>
.card {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
}
.form {
  display: grid;
  gap: 12px;
}
label {
  display: grid;
  gap: 6px;
  font-size: 13px;
}
input {
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(0, 0, 0, 0.3);
  color: inherit;
}
button {
  padding: 10px;
  border: none;
  border-radius: 8px;
  background: #7c3aed;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}
.err {
  color: #fca5a5;
  margin: 0;
}
</style>
