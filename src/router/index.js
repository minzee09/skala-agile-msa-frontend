import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  { path: '/', name: 'splash', component: () => import('@/views/entry/SplashView.vue') },
  {
    path: '/start',
    name: 'start',
    component: () => import('@/views/entry/RoleLoginView.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/callback',
    name: 'callback',
    component: () => import('@/views/entry/CallbackView.vue'),
  },

  {
    path: '/hr',
    component: () => import('@/layouts/HrLayout.vue'),
    meta: { requiresAuth: true, hrOnly: true },
    children: [
      { path: '', name: 'hr-dashboard', component: () => import('@/views/hr/DashboardView.vue') },
      { path: 'intro', name: 'hr-intro', component: () => import('@/views/hr/PainPointsView.vue') },
      {
        path: 'screening',
        name: 'hr-screening',
        component: () => import('@/views/hr/ScreeningView.vue'),
      },
      {
        path: 'notice',
        name: 'hr-notice',
        component: () => import('@/views/hr/NoticeSendView.vue'),
      },
      {
        path: 'courses/new',
        name: 'hr-course-create',
        component: () => import('@/views/hr/CourseCreateView.vue'),
      },
    ],
  },

  {
    path: '/me',
    component: () => import('@/layouts/EmployeeLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'me-home', component: () => import('@/views/employee/MyLearningView.vue') },
      {
        path: 'courses',
        name: 'me-courses',
        component: () => import('@/views/employee/CourseCatalogView.vue'),
      },
      {
        path: 'certificates',
        name: 'me-certificates',
        component: () => import('@/views/employee/CertificateView.vue'),
      },
    ],
  },

  { path: '/:pathMatch(.*)*', redirect: { name: 'splash' } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isAuthenticated) return { name: 'start' }
  if (to.meta.guestOnly && auth.isAuthenticated) return auth.homeRoute
  if (to.meta.hrOnly && !auth.isHr) return { name: 'me-home' }
})

export default router
