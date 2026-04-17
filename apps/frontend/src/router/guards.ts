import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { getAccessToken } from '../api/http'

export function authGuard(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext,
) {
  const publicNames = new Set([
    'home',
    'login',
    'login-phone',
    'register',
    'register-phone',
  ])
  if (publicNames.has(String(to.name)) || to.meta.public) {
    next()
    return
  }
  if (!getAccessToken()) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }
  next()
}
