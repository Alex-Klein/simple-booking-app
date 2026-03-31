import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import BookView from '../views/BookView.vue'
import ConfirmView from '../views/ConfirmView.vue'
import LoginView from '../views/LoginView.vue'
import AdminView from '../views/AdminView.vue'
import CancelView from '../views/CancelView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomeView },
    { path: '/book', component: BookView },
    { path: '/confirm', component: ConfirmView },
    { path: '/cancel', component: CancelView },
    { path: '/login', component: LoginView },
    { path: '/admin', component: AdminView, meta: { requiresAdmin: true } },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach((to) => {
  if (to.meta.requiresAdmin && !localStorage.getItem('admin_token')) {
    return '/login'
  }
})

export default router
