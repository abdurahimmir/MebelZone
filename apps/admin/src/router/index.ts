import { createRouter, createWebHistory } from 'vue-router'
import { adminAuthGuard } from './guards'
import DashboardView from '../views/DashboardView.vue'
import JsonListView from '../views/JsonListView.vue'
import LoginView from '../views/LoginView.vue'
import MaterialsAdminView from '../views/MaterialsAdminView.vue'
import ProjectsAdminView from '../views/ProjectsAdminView.vue'
import SettingsView from '../views/SettingsView.vue'
import UsersView from '../views/UsersView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { public: true },
    },
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
    },
    {
      path: '/users',
      name: 'users',
      component: UsersView,
    },
    {
      path: '/projects',
      name: 'projects',
      component: ProjectsAdminView,
    },
    {
      path: '/materials',
      name: 'materials',
      component: MaterialsAdminView,
    },
    {
      path: '/textures',
      name: 'textures',
      component: JsonListView,
      props: { title: 'Текстуры', path: '/admin/textures' },
    },
    {
      path: '/hardware',
      name: 'hardware',
      component: JsonListView,
      props: { title: 'Фурнитура', path: '/admin/hardware' },
    },
    {
      path: '/profiles',
      name: 'profiles',
      component: JsonListView,
      props: { title: 'Профили / пресеты', path: '/admin/profiles' },
    },
    {
      path: '/tariffs',
      name: 'tariffs',
      component: JsonListView,
      props: { title: 'Тарифы', path: '/admin/tariffs' },
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView,
    },
  ],
})

router.beforeEach(adminAuthGuard)

export default router
