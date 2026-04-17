import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { getAccessToken } from '../api/http'
import { useAuthStore } from '../stores/auth'

export async function adminAuthGuard(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext,
) {
  if (to.meta.public) {
    next()
    return
  }
  if (!getAccessToken()) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }
  const auth = useAuthStore()
  if (!auth.me) await auth.loadMe()
  if (!auth.isAdmin) {
    next({ name: 'login' })
    return
  }
  next()
}
