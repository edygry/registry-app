<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1>📋 My Registries</h1>
      <button @click="showCreateModal = true" class="btn btn-primary">+ New Registry</button>
    </div>

    <div v-if="loading" class="loading">Loading registries...</div>

    <div v-else-if="registries.length === 0" class="empty-state">
      <h2>No registries yet</h2>
      <p>Create your first registry to get started.</p>
      <button @click="showCreateModal = true" class="btn btn-primary">Create Registry</button>
    </div>

    <div v-else class="registry-grid">
      <div class="registry-card" v-for="registry in registries" :key="registry._id">
        <div class="registry-header">
          <h3>{{ registry.name }}</h3>
          <span class="badge" :class="getTypeBadge(registry.type)">{{ registry.type }}</span>
        </div>
        <p class="registry-desc">{{ getRegistryDescription(registry.type) }}</p>
        <div class="registry-meta">
          <span>👤 {{ registry.members?.length || 0 }} members</span>
          <span>📝 {{ getRecordCount(registry._id) }} records</span>
        </div>
        <div class="registry-actions">
          <router-link :to="`/registry/${registry._id}`" class="btn btn-secondary">View</router-link>
          <router-link v-if="isOwner(registry)" :to="`/registry/${registry._id}/configure`" class="btn btn-secondary">Configure</router-link>
          <router-link :to="`/registry/${registry._id}/records`" class="btn btn-secondary">Records</router-link>
          <button @click="showInviteModal(registry)" class="btn btn-primary">Invite</button>
        </div>
      </div>
    </div>

    <!-- Create Registry Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>Create New Registry</h2>
          <button @click="showCreateModal = false" class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="registryName">Registry Name</label>
            <input 
              id="registryName"
              v-model="newRegistry.name" 
              type="text" 
              required 
              placeholder="My Registry"
            />
          </div>

          <div class="form-group">
            <label for="registryType">Registry Type</label>
            <select id="registryType" v-model="newRegistry.type" required>
              <option value="">Select type...</option>
              <option value="wedding">Wedding Registry</option>
              <option value="clinical">Clinical Trial Registry</option>
              <option value="inventory">Inventory Registry</option>
              <option value="custom">Custom Registry</option>
            </select>
          </div>

          <div class="form-group">
            <label for="registryDesc">Description</label>
            <textarea 
              id="registryDesc"
              v-model="newRegistry.description" 
              rows="3"
              placeholder="What is this registry for?"
            ></textarea>
          </div>

          <div v-if="newRegistry.type" class="template-preview">
            <h3>Template Preview</h3>
            <p>{{ getRegistryDescription(newRegistry.type) }}</p>
            <div class="fields-preview">
              <h4>Fields:</h4>
              <ul>
                <li v-for="field in getTemplateFields(newRegistry.type)" :key="field.name">
                  {{ field.label }} ({{ field.type }}) {{ field.required ? '*' : '' }}
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showCreateModal = false" class="btn btn-secondary">Cancel</button>
          <button @click="createRegistry" class="btn btn-primary" :disabled="creating">
            {{ creating ? 'Creating...' : 'Create Registry' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Invite Modal -->
    <div v-if="showInviteModalOpen" class="modal-overlay" @click.self="showInviteModalOpen = false">
      <div class="modal">
        <div class="modal-header">
          <h2>Invite to {{ selectedRegistry?.name }}</h2>
          <button @click="showInviteModalOpen = false" class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <div class="alert alert-info">
            <strong>Simulated Invitation</strong><br>
            In production, this would send an email. For MVP, copy the link below and share it manually.
          </div>

          <div class="form-group">
            <label for="inviteEmail">Email</label>
            <input 
              id="inviteEmail"
              v-model="inviteEmail" 
              type="email" 
              required 
              placeholder="invitee@email.com"
            />
          </div>

          <div class="form-group">
            <label for="inviteRole">Role</label>
            <select id="inviteRole" v-model="inviteRole">
              <option value="member">Member</option>
              <option value="admin">Admin</option>
              <option value="guest">Guest</option>
            </select>
          </div>

          <div v-if="invitationLink" class="invitation-link">
            <label>Invitation Link:</label>
            <div class="link-box">
              <code>{{ invitationLink }}</code>
              <button @click="copyLink" class="btn btn-secondary btn-sm">Copy</button>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showInviteModalOpen = false" class="btn btn-secondary">Close</button>
          <button @click="sendInvitation" class="btn btn-primary" :disabled="sending">
            {{ sending ? 'Creating...' : 'Create Invitation' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useAuthStore } from '../store/auth.js'
import { useRegistryStore } from '../store/registry.js'
import { REGISTRY_TEMPLATES } from '../database/schema.js'

export default {
  name: 'Dashboard',
  data() {
    return {
      loading: true,
      creating: false,
      sending: false,
      showCreateModal: false,
      showInviteModalOpen: false,
      registries: [],
      newRegistry: {
        name: '',
        type: '',
        description: ''
      },
      selectedRegistry: null,
      inviteEmail: '',
      inviteRole: 'member',
      invitationLink: ''
    }
  },
  async mounted() {
    await this.loadRegistries()
  },
  methods: {
    async loadRegistries() {
      const auth = useAuthStore()
      const registry = useRegistryStore()
      
      if (auth.currentTenant) {
        await registry.loadRegistries(auth.currentTenant._id)
        this.registries = registry.registries
      }
      this.loading = false
    },

    getTypeBadge(type) {
      const badges = {
        wedding: 'badge-primary',
        clinical: 'badge-success',
        inventory: 'badge-warning',
        custom: 'badge-danger'
      }
      return badges[type] || 'badge-primary'
    },

    getRegistryDescription(type) {
      const descriptions = {
        wedding: 'Track wedding gifts and preferences',
        clinical: 'Manage clinical trial patient data',
        inventory: 'Track inventory items and quantities',
        custom: 'Custom registry with configurable fields'
      }
      return descriptions[type] || 'Custom registry'
    },

    getTemplateFields(type) {
      return REGISTRY_TEMPLATES[type]?.fields || []
    },

    getRecordCount(registryId) {
      const registry = useRegistryStore()
      return registry.records.filter(r => r.registryId === registryId).length
    },

    isOwner(registry) {
      const auth = useAuthStore()
      return registry.ownerId === auth.user?._id || 
             registry.coOwners?.includes(auth.user?._id) ||
             auth.user?.role === 'admin'
    },

    async createRegistry() {
      if (!this.newRegistry.name || !this.newRegistry.type) return
      
      this.creating = true
      const auth = useAuthStore()
      const registry = useRegistryStore()
      
      const template = REGISTRY_TEMPLATES[this.newRegistry.type]
      
      await registry.createRegistry({
        tenantId: auth.currentTenant._id,
        name: this.newRegistry.name,
        type: this.newRegistry.type,
        description: this.newRegistry.description,
        ownerId: auth.user._id,
        config: {
          fields: template?.fields || [],
          settings: template?.settings || {
            allowPublicView: false,
            allowMultipleEntries: true,
            requireApproval: false
          }
        }
      })

      this.showCreateModal = false
      this.newRegistry = { name: '', type: '', description: '' }
      await this.loadRegistries()
      this.creating = false
    },

    showInviteModal(registry) {
      this.selectedRegistry = registry
      this.showInviteModalOpen = true
      this.inviteEmail = ''
      this.inviteRole = 'member'
      this.invitationLink = ''
    },

    async sendInvitation() {
      if (!this.inviteEmail || !this.selectedRegistry) return
      
      this.sending = true
      const registry = useRegistryStore()
      
      const invitation = await registry.simulateInvitation(
        this.selectedRegistry._id,
        this.inviteEmail,
        this.inviteRole
      )
      
      this.invitationLink = window.location.origin + '/#' + invitation.url
      this.sending = false
    },

    copyLink() {
      navigator.clipboard.writeText(this.invitationLink)
      alert('Link copied to clipboard!')
    }
  }
}
</script>

<style scoped>
.dashboard {
  padding: 20px 0;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.dashboard-header h1 {
  font-size: 2rem;
}

.loading, .empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.empty-state h2 {
  margin-bottom: 10px;
}

.empty-state p {
  margin-bottom: 20px;
}

.registry-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.registry-card {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.registry-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.registry-header h3 {
  margin: 0;
}

.registry-desc {
  color: #666;
  margin-bottom: 15px;
}

.registry-meta {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
  color: #999;
  font-size: 0.9rem;
}

.registry-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.registry-actions .btn {
  flex: 1;
  min-width: 80px;
  text-align: center;
  text-decoration: none;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 15px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #eee;
}

.template-preview {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-top: 15px;
}

.template-preview h3 {
  margin-bottom: 10px;
  color: #667eea;
}

.template-preview h4 {
  margin: 10px 0 5px;
  font-size: 0.9rem;
}

.template-preview ul {
  padding-left: 20px;
  color: #666;
}

.invitation-link {
  margin-top: 15px;
}

.link-box {
  display: flex;
  gap: 10px;
  align-items: center;
  background: #f8f9fa;
  padding: 10px;
  border-radius: 5px;
  margin-top: 5px;
}

.link-box code {
  flex: 1;
  word-break: break-all;
  font-size: 0.85rem;
}

.btn-sm {
  padding: 5px 10px;
  font-size: 0.85rem;
}

@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .registry-grid {
    grid-template-columns: 1fr;
  }
  
  .registry-actions {
    flex-direction: column;
  }
}
</style>
