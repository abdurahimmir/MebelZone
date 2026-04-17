import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { apiFetch, clearTokens, getAccessToken, getRefreshToken, setTokens } from '../api/http'

type Me = {
  id: string
  fullName: string
  email: string | null
  phone: string | null
  role: string
}

export const useAuthStore = defineStore('auth', () => {
  const me = ref<Me | null>(null)
  const loading = ref(false)

  const isAuthenticated = computed(() => Boolean(getAccessToken()))

  async function loginEmail(email: string, password: string) {
    loading.value = true
    try {
      const res = await apiFetch<{ accessToken: string; refreshToken: string; expiresIn: number }>(
        '/auth/login/email',
        { method: 'POST', json: { email, password } },
      )
      setTokens(res.accessToken, res.refreshToken)
      await loadMe()
    } finally {
      loading.value = false
    }
  }

  async function sendPhoneOtp(phone: string) {
    return apiFetch<{ ok: boolean; devCode?: string }>('/auth/phone/send-otp', {
      method: 'POST',
      json: { phone },
    })
  }

  async function registerPhone(fullName: string, phone: string, password: string, otp: string) {
    loading.value = true
    try {
      const res = await apiFetch<{ accessToken: string; refreshToken: string; expiresIn: number }>(
        '/auth/register/phone',
        { method: 'POST', json: { fullName, phone, password, otp } },
      )
      setTokens(res.accessToken, res.refreshToken)
      await loadMe()
    } finally {
      loading.value = false
    }
  }

  async function loginPhone(phone: string, password?: string, otp?: string) {
    loading.value = true
    try {
      const body: Record<string, string> = { phone }
      if (otp) body.otp = otp
      else if (password) body.password = password
      const res = await apiFetch<{ accessToken: string; refreshToken: string; expiresIn: number }>(
        '/auth/login/phone',
        { method: 'POST', json: body },
      )
      setTokens(res.accessToken, res.refreshToken)
      await loadMe()
    } finally {
      loading.value = false
    }
  }

  async function registerEmail(fullName: string, email: string, password: string) {
    loading.value = true
    try {
      const res = await apiFetch<{ accessToken: string; refreshToken: string; expiresIn: number }>(
        '/auth/register/email',
        { method: 'POST', json: { fullName, email, password } },
      )
      setTokens(res.accessToken, res.refreshToken)
      await loadMe()
    } finally {
      loading.value = false
    }
  }

  async function loadMe() {
    if (!getAccessToken()) {
      me.value = null
      return
    }
    me.value = await apiFetch<Me>('/auth/me')
  }

  async function logout() {
    const refreshToken = getRefreshToken()
    try {
      if (getAccessToken()) {
        await apiFetch('/auth/logout', {
          method: 'POST',
          json: refreshToken ? { refreshToken } : {},
        })
      }
    } catch {
      // ignore
    }
    clearTokens()
    me.value = null
  }

  return {
    me,
    loading,
    isAuthenticated,
    loginEmail,
    loginPhone,
    registerEmail,
    registerPhone,
    sendPhoneOtp,
    loadMe,
    logout,
  }
})
