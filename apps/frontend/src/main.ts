import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import './style.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)

void router.isReady().then(async () => {
  const auth = useAuthStore(pinia)
  await auth.loadMe()
  app.mount('#app')
})
