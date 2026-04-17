import { defineAsyncComponent } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { authGuard } from './guards'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import LoginPhoneView from '../views/LoginPhoneView.vue'
import ProjectsView from '../views/ProjectsView.vue'
import RegisterView from '../views/RegisterView.vue'
import RegisterPhoneView from '../views/RegisterPhoneView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { public: true },
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { public: true },
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: { public: true },
    },
    {
      path: '/register-phone',
      name: 'register-phone',
      component: RegisterPhoneView,
      meta: { public: true },
    },
    {
      path: '/login-phone',
      name: 'login-phone',
      component: LoginPhoneView,
      meta: { public: true },
    },
    {
      path: '/projects',
      name: 'projects',
      component: ProjectsView,
    },
    {
      path: '/editor/:id',
      name: 'editor',
      component: defineAsyncComponent(() => import('../views/EditorView.vue')),
    },
  ],
})

router.beforeEach(authGuard)

export default router
