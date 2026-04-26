<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1>📝 Create Account</h1>
      <p class="auth-subtitle">Start using registries today</p>

      <div v-if="error" class="alert alert-error">{{ error }}</div>

      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label for="name">Full Name</label>
          <input 
            id="name"
            v-model="name" 
            type="text" 
            required 
            placeholder="John Doe"
          />
        </div>

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

        <div class="form-group">
          <label for="tenantName">Workspace Name (optional)</label>
          <input 
            id="tenantName"
            v-model="tenantName" 
            type="text" 
            placeholder="My Workspace"
          />
          <small class="form-hint">Create a new workspace or join an existing one.</small>
        </div>

        <button type="submit" class="btn btn-primary btn-full" :disabled="loading">
          {{ loading ? 'Creating account...' : 'Create Account' }}
        </button>
      </form>

      <div class="auth-footer">
        <p>Already have an account? <router-link to="/login">Sign in</router-link></p>
        <p>Have an invitation? <router-link to="/invite">Accept Invitation</router-link></p>
      </div>
    </div>
  </div>
</template>

<script>
import { useAuthStore } from '../store/auth.js'

export default {
  name: 'Register',
  data() {
    return {
      name: '',
      email: '',
      password: '',
      tenantName: '',
      loading: false,
      error: ''
    }
  },
  methods: {
    async handleRegister() {
      this.loading = true
      this.error = ''
      
      try {
        const auth = useAuthStore()
        await auth.register(this.email, this.name, this.tenantName || null)
        this.$router.push('/dashboard')
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
