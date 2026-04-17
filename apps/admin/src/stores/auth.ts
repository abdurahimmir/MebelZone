import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { apiFetch, clearTokens, getAccessToken, getRefreshToken, setTokens } from '../api/http'

type Me = { id: string; fullName: string; email: string | null; role: string }

export const useAuthStore = defineStore('auth', () => {
  const me = ref<Me | null>(null)
  const loading = ref(false)

  const isAdmin = computed(() => me.value?.role === 'ADMIN')

  async function login(email: string, password: string) {
    loading.value = true
    try {
      const res = await apiFetch<{ accessToken: string; refreshToken: string }>(
        '/auth/login/email',
        { method: 'POST', json: { email, password } },
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
    const rt = getRefreshToken()
    try {
      if (getAccessToken()) {
        await apiFetch('/auth/logout', { method: 'POST', json: rt ? { refreshToken: rt } : {} })
      }
    } catch {
      // ignore
    }
    clearTokens()
    me.value = null
  }

  return { me, loading, isAdmin, login, loadMe, logout }
})
