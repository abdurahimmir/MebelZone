import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const apiBaseUrl = ref(import.meta.env.VITE_API_BASE_URL as string)

  const appName = computed(() => import.meta.env.VITE_APP_NAME as string)

  return { apiBaseUrl, appName }
})
