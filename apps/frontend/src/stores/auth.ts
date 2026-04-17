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

  return { me, loading, isAuthenticated, loginEmail, registerEmail, loadMe, logout }
})
