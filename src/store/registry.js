import { defineStore } from 'pinia'
import { db } from '../database/localStorage.js'

export const useRegistryStore = defineStore('registry', {
  state: () => ({
    registries: [],
    currentRegistry: null,
    records: [],
    templates: []
  }),

  getters: {
    weddingRegistries: (state) => state.registries.filter(r => r.type === 'wedding'),
    clinicalRegistries: (state) => state.registries.filter(r => r.type === 'clinical'),
    inventoryRegistries: (state) => state.registries.filter(r => r.type === 'inventory'),
    
    canEdit: (state) => {
      if (!state.currentRegistry) return false
      const authStore = useAuthStore()
      return state.currentRegistry.ownerId === authStore.user?._id ||
             state.currentRegistry.coOwners?.includes(authStore.user?._id) ||
             authStore.user?.role === 'admin'
    }
  },

  actions: {
    async loadTemplates() {
      this.templates = await db.find('registry_templates')
    },

    async loadRegistries(tenantId) {
      this.registries = await db.find('registries', { tenantId })
    },

    async loadRegistry(registryId) {
      this.currentRegistry = await db.findOne('registries', { _id: registryId })
      this.records = await db.find('records', { registryId })
    },

    async createRegistry(data) {
      const registry = await db.insertOne('registries', {
        ...data,
        status: 'active',
        members: [data.ownerId],
        coOwners: []
      })
      
      this.registries.push(registry)
      return registry
    },

    async updateRegistry(registryId, updates) {
      const updated = await db.updateOne('registries', { _id: registryId }, updates)
      const index = this.registries.findIndex(r => r._id === registryId)
      if (index !== -1) {
        this.registries[index] = updated
      }
      if (this.currentRegistry?._id === registryId) {
        this.currentRegistry = updated
      }
      return updated
    },

    async addRecord(registryId, personId, data) {
      const authStore = useAuthStore()
      const record = await db.insertOne('records', {
        registryId,
        personId,
        enteredBy: authStore.user._id,
        data,
        status: 'pending'
      })
      
      this.records.push(record)
      return record
    },

    async updateRecord(recordId, updates) {
      const updated = await db.updateOne('records', { _id: recordId }, updates)
      const index = this.records.findIndex(r => r._id === recordId)
      if (index !== -1) {
        this.records[index] = updated
      }
      return updated
    },

    async deleteRecord(recordId) {
      await db.deleteOne('records', { _id: recordId })
      this.records = this.records.filter(r => r._id !== recordId)
    },

    async getRecordsByPerson(registryId, personId) {
      return await db.find('records', { registryId, personId })
    },

    async simulateInvitation(registryId, email, role = 'member') {
      const authStore = useAuthStore()
      const token = Math.random().toString(36).substr(2)
      
      const invitation = await db.insertOne('invitations', {
        registryId,
        email,
        role,
        token,
        status: 'pending',
        invitedBy: authStore.user._id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      })

      // Return the invitation URL for manual sharing (since we can't send emails in MVP)
      return {
        ...invitation,
        url: `#/invite/${token}`
      }
    }
  }
})

// Import auth store for getters
import { useAuthStore } from './auth.js'
