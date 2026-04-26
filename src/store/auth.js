import { defineStore } from 'pinia'
import { db } from '../database/localStorage.js'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    tenants: [],
    currentTenant: null,
    isAuthenticated: false
  }),

  getters: {
    currentUser: (state) => state.user,
    isOwner: (state) => state.user?.role === 'owner' || state.user?.role === 'admin',
    currentTenantId: (state) => state.currentTenant?._id
  },

  actions: {
    async init() {
      // Load from localStorage
      const savedUser = localStorage.getItem('registry_user')
      if (savedUser) {
        this.user = JSON.parse(savedUser)
        this.isAuthenticated = true
        
        // Load user's tenants
        const allTenants = await db.find('tenants')
        this.tenants = allTenants.filter(t => 
          t.members?.includes(this.user._id) || t.ownerId === this.user._id
        )
        
        if (this.tenants.length > 0) {
          this.currentTenant = this.tenants[0]
        }
      }
    },

    async register(email, name, tenantName = null) {
      // In MVP, no password required
      // In production, this would hash the password
      
      let tenant = this.currentTenant
      
      // Create tenant if first user
      if (!tenant && tenantName) {
        tenant = await db.insertOne('tenants', {
          name: tenantName,
          slug: tenantName.toLowerCase().replace(/\s+/g, '-'),
          ownerId: null, // Will be set after user creation
          members: [],
          settings: {
            maxRegistries: 10,
            maxUsers: 50,
            features: ['all']
          }
        })
      }

      // Create user
      const user = await db.insertOne('users', {
        tenantId: tenant?._id,
        email,
        name,
        role: tenant ? 'member' : 'owner',
        password: '', // Placeholder for production
        profile: {},
        registries: []
      })

      // Update tenant with owner
      if (tenant) {
        await db.updateOne('tenants', { _id: tenant._id }, {
          ownerId: user._id,
          members: [...(tenant.members || []), user._id]
        })
      }

      // Set as current user
      this.user = user
      this.isAuthenticated = true
      this.currentTenant = tenant
      localStorage.setItem('registry_user', JSON.stringify(user))

      return user
    },

    async login(email) {
      const user = await db.findOne('users', { email })
      
      if (!user) {
        throw new Error('User not found. Please register first.')
      }

      // In MVP, no password check
      // In production, verify password hash

      this.user = user
      this.isAuthenticated = true
      
      // Update last login
      await db.updateOne('users', { _id: user._id }, {
        lastLogin: new Date().toISOString()
      })

      // Load tenant
      const tenant = await db.findOne('tenants', { _id: user.tenantId })
      this.currentTenant = tenant

      localStorage.setItem('registry_user', JSON.stringify(user))
      
      return user
    },

    async acceptInvitation(token, email, name) {
      // Find invitation
      const invitation = await db.findOne('invitations', { 
        token,
        status: 'pending'
      })

      if (!invitation) {
        throw new Error('Invalid or expired invitation')
      }

      // Create user
      const user = await db.registerUser(email, name)

      // Add user to registry
      const registry = await db.findOne('registries', { _id: invitation.registryId })
      await db.updateOne('registries', { _id: registry._id }, {
        members: [...(registry.members || []), user._id]
      })

      // Update invitation
      await db.updateOne('invitations', { _id: invitation._id }, {
        status: 'accepted',
        acceptedBy: user._id
      })

      this.user = user
      this.isAuthenticated = true
      localStorage.setItem('registry_user', JSON.stringify(user))

      return { user, registry }
    },

    logout() {
      this.user = null
      this.isAuthenticated = false
      this.currentTenant = null
      localStorage.removeItem('registry_user')
    }
  }
})
