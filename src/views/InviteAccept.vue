<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1>📧 Accept Invitation</h1>
      <p class="auth-subtitle">Create your account to join the registry</p>

      <div v-if="error" class="alert alert-error">{{ error }}</div>
      <div v-if="success" class="alert alert-success">{{ success }}</div>

      <div v-if="!invitation" class="alert alert-info">
        Enter your invitation token or use the link you received.
      </div>

      <div v-if="invitation">
        <div class="alert alert-info">
          <strong>You're invited to join:</strong> {{ invitation.registryName }}<br>
          <strong>Role:</strong> {{ invitation.role }}<br>
          <strong>Invited by:</strong> {{ invitation.invitedByName }}
        </div>

        <form @submit.prevent="handleAccept">
          <div class="form-group">
            <label for="email">Email</label>
            <input 
              id="email"
              v-model="email" 
              type="email" 
              required 
              :value="invitation?.email"
            />
          </div>

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
            <label for="password">Password</label>
            <input 
              id="password"
              v-model="password" 
              type="password" 
              placeholder="Password (not required in MVP)"
            />
          </div>

          <button type="submit" class="btn btn-primary btn-full" :disabled="loading">
            {{ loading ? 'Creating account...' : 'Accept Invitation & Create Account' }}
          </button>
        </form>
      </div>

      <div class="auth-footer">
        <p>Don't have an invitation? <router-link to="/register">Register</router-link></p>
      </div>
    </div>
  </div>
</template>

<script>
import { useAuthStore } from '../store/auth.js'
import { db } from '../database/localStorage.js'

export default {
  name: 'InviteAccept',
  data() {
    return {
      email: '',
      name: '',
      password: '',
      loading: false,
      error: '',
      success: '',
      invitation: null
    }
  },
  async mounted() {
    const token = this.$route.params.token
    if (token) {
      await this.loadInvitation(token)
    }
  },
  methods: {
    async loadInvitation(token) {
      try {
        const invitation = await db.findOne('invitations', { 
          token,
          status: 'pending'
        })

        if (!invitation) {
          this.error = 'Invalid or expired invitation'
          return
        }

        // Check if expired
        if (new Date(invitation.expiresAt) < new Date()) {
          this.error = 'Invitation has expired'
          return
        }

        // Get registry info
        const registry = await db.findOne('registries', { _id: invitation.registryId })
        const invitedBy = await db.findOne('users', { _id: invitation.invitedBy })

        this.invitation = {
          ...invitation,
          registryName: registry?.name || 'Unknown Registry',
          invitedByName: invitedBy?.name || 'Unknown'
        }

        this.email = invitation.email
      } catch (err) {
        this.error = 'Failed to load invitation'
      }
    },

    async handleAccept() {
      this.loading = true
      this.error = ''
      
      try {
        const auth = useAuthStore()
        const result = await auth.acceptInvitation(
          this.$route.params.token,
          this.email,
          this.name
        )
        
        this.success = 'Account created! Redirecting to registry...'
        setTimeout(() => {
          this.$router.push(`/registry/${result.registry._id}`)
        }, 1000)
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
</style>
