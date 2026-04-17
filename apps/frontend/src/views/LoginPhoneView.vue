<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const phone = ref('')
const password = ref('')
const otp = ref('')
const mode = ref<'password' | 'otp'>('password')
const devHint = ref('')
const error = ref('')

async function sendOtp() {
  error.value = ''
  devHint.value = ''
  try {
    const r = await auth.sendPhoneOtp(phone.value)
    if (r.devCode) devHint.value = `Код (dev): ${r.devCode}`
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось отправить OTP'
  }
}

async function submit() {
  error.value = ''
  try {
    if (mode.value === 'otp') {
      await auth.loginPhone(phone.value, undefined, otp.value)
    } else {
      await auth.loginPhone(phone.value, password.value)
    }
    await router.push('/projects')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Ошибка входа'
  }
}
</script>

<template>
  <div class="card">
    <h1>Вход по телефону</h1>
    <div class="tabs">
      <button type="button" :class="{ on: mode === 'password' }" @click="mode = 'password'">Пароль</button>
      <button type="button" :class="{ on: mode === 'otp' }" @click="mode = 'otp'">OTP</button>
    </div>
    <form class="form" @submit.prevent="submit">
      <label>
        Телефон
        <input v-model="phone" type="tel" required placeholder="+79991234567" />
      </label>
      <template v-if="mode === 'password'">
        <label>
          Пароль
          <input v-model="password" type="password" required autocomplete="current-password" />
        </label>
      </template>
      <template v-else>
        <button type="button" class="secondary" @click="sendOtp">Отправить OTP</button>
        <p v-if="devHint" class="hint">{{ devHint }}</p>
        <label>
          OTP
          <input v-model="otp" type="text" inputmode="numeric" maxlength="6" required />
        </label>
      </template>
      <p v-if="error" class="error">{{ error }}</p>
      <button type="submit" :disabled="auth.loading">Войти</button>
    </form>
    <p class="muted">
      <RouterLink to="/login">Email</RouterLink>
      ·
      <RouterLink to="/register-phone">Регистрация</RouterLink>
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
  margin: 0 0 12px;
  font-size: 22px;
}
.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.tabs button {
  flex: 1;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.85);
}
.tabs button.on {
  background: #3b82f6;
  color: #fff;
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
button.secondary {
  background: rgba(255, 255, 255, 0.1);
}
button:disabled {
  opacity: 0.6;
}
.error {
  color: #fca5a5;
  margin: 0;
}
.hint {
  margin: 0;
  font-size: 13px;
  color: #fde68a;
}
.muted {
  margin-top: 14px;
  font-size: 14px;
}
a {
  color: #93c5fd;
}
</style>
