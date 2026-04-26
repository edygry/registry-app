export default [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue')
  },
  {
    path: '/invite/:token',
    name: 'InviteAccept',
    component: () => import('../views/InviteAccept.vue')
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/registry/:id',
    name: 'RegistryView',
    component: () => import('../views/RegistryView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/registry/:id/configure',
    name: 'RegistryConfigure',
    component: () => import('../views/RegistryConfigure.vue'),
    meta: { requiresAuth: true, requiresOwner: true }
  },
  {
    path: '/registry/:id/records',
    name: 'RegistryRecords',
    component: () => import('../views/RegistryRecords.vue'),
    meta: { requiresAuth: true }
  }
]
