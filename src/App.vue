<template>
  <div class="app">
    <nav class="navbar" v-if="auth.isAuthenticated">
      <div class="nav-content">
        <router-link to="/dashboard" class="nav-brand">📋 Registry App</router-link>
        <div class="nav-links">
          <router-link to="/dashboard">Dashboard</router-link>
          <span class="nav-user">{{ auth.user?.name }}</span>
          <button @click="logout" class="btn-logout">Logout</button>
        </div>
      </div>
    </nav>

    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script>
import { useAuthStore } from './store/auth.js'
import { db } from './database/localStorage.js'

export default {
  name: 'App',
  setup() {
    const auth = useAuthStore()
    
    const logout = () => {
      auth.logout()
    }

    return { auth, logout }
  },
  async mounted() {
    await db.seed()
    await this.auth.init()
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f5f7fa;
  color: #333;
}

.navbar {
  background: #2d3748;
  color: white;
  padding: 0 20px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
}

.nav-brand {
  color: white;
  text-decoration: none;
  font-size: 1.2rem;
  font-weight: bold;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 20px;
}

.nav-links a {
  color: #a0aec0;
  text-decoration: none;
  transition: color 0.3s;
}

.nav-links a:hover,
.nav-links a.router-link-active {
  color: white;
}

.nav-user {
  color: #a0aec0;
  font-size: 0.9rem;
}

.btn-logout {
  background: transparent;
  border: 1px solid #a0aec0;
  color: #a0aec0;
  padding: 6px 12px;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-logout:hover {
  background: #a0aec0;
  color: #2d3748;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

/* Form styles */
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 1rem;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5a67d8;
}

.btn-secondary {
  background: #e2e8f0;
  color: #4a5568;
}

.btn-secondary:hover {
  background: #cbd5e0;
}

.btn-danger {
  background: #f56565;
  color: white;
}

.btn-danger:hover {
  background: #e53e3e;
}

.btn-success {
  background: #48bb78;
  color: white;
}

.btn-success:hover {
  background: #38a169;
}

.card {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.badge-primary {
  background: #e3f2fd;
  color: #1976d2;
}

.badge-success {
  background: #e8f5e9;
  color: #388e3c;
}

.badge-warning {
  background: #fff3e0;
  color: #f57c00;
}

.badge-danger {
  background: #ffebee;
  color: #d32f2f;
}

.alert {
  padding: 15px;
  border-radius: 5px;
  margin-bottom: 20px;
}

.alert-success {
  background: #e8f5e9;
  color: #388e3c;
  border: 1px solid #c8e6c9;
}

.alert-error {
  background: #ffebee;
  color: #d32f2f;
  border: 1px solid #ffcdd2;
}

.alert-info {
  background: #e3f2fd;
  color: #1976d2;
  border: 1px solid #bbdefb;
}

@media (max-width: 768px) {
  .nav-content {
    flex-direction: column;
    height: auto;
    padding: 10px 0;
  }
  
  .nav-links {
    flex-direction: column;
    gap: 10px;
  }
  
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
