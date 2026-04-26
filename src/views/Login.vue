<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1>🔐 Sign In</h1>
      <p class="auth-subtitle">Access your registries</p>

      <div v-if="error" class="alert alert-error">{{ error }}</div>
      <div v-if="success" class="alert alert-success">{{ success }}</div>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="email">Email</label>
          <input 
            id="email"
            v-model="email" 
            type="email" 
            required 
            placeholder="your@email.com"
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input 
            id="password"
            v-model="password" 
            type="password" 
            placeholder="Password (not required in MVP)"
          />
          <small class="form-hint">Password field reserved for production. No password required in MVP.</small>
        </div>

        <button type="submit" class="btn btn-primary btn-full" :disabled="loading">
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>

      <div class="auth-footer">
        <p>Don't have an account? <router-link to="/register">Register</router-link></p>
        <p>Have an invitation? <router-link to="/invite">Accept Invitation</router-link></p>
      </div>
    </div>
  </div>
</template>

<script>
import { useAuthStore } from '../store/auth.js'

export default {
  name: 'Login',
  data() {
    return {
      email: '',
      password: '',
      loading: false,
      error: '',
      success: ''
    }
  },
  methods: {
    async handleLogin() {
      this.loading = true
      this.error = ''
      
      try {
        const auth = useAuthStore()
        await auth.login(this.email)
        this.success = 'Signed in successfully!'
        setTimeout(() => {
          this.$router.push('/dashboard')
        }, 500)
      } catch (err) {
        this.error = err.message
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.auth-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
}

.auth-card {
  background: white;
  padding: 40px;
  border-radius: 15px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 450px;
}

.auth-card h1 {
  text-align: center;
  margin-bottom: 10px;
}

.auth-subtitle {
  text-align: center;
  color: #666;
  margin-bottom: 30px;
}

.btn-full {
  width: 100%;
  padding: 12px;
  font-size: 1.1rem;
}

.auth-footer {
  margin-top: 20px;
  text-align: center;
  color: #666;
}

.auth-footer a {
  color: #667eea;
  text-decoration: none;
}

.auth-footer a:hover {
  text-decoration: underline;
}

.form-hint {
  display: block;
  margin-top: 5px;
  color: #999;
  font-size: 0.85rem;
}
</style>
