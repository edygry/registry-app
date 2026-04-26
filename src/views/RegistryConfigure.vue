<template>
  <div class="configure-page">
    <div v-if="loading" class="loading">Loading...</div>

    <div v-else-if="!registry" class="error">
      <h2>Registry not found</h2>
      <router-link to="/dashboard" class="btn btn-primary">Back to Dashboard</router-link>
    </div>

    <div v-else>
      <div class="configure-header">
        <h1>⚙️ Configure: {{ registry.name }}</h1>
        <router-link :to="`/registry/${registry._id}`" class="btn btn-secondary">Back to Registry</router-link>
      </div>

      <div class="configure-grid">
        <!-- Basic Settings -->
        <div class="card">
          <h2>Basic Settings</h2>
          <div class="form-group">
            <label for="name">Registry Name</label>
            <input 
              id="name"
              v-model="config.name" 
              type="text" 
              required
            />
          </div>

          <div class="form-group">
            <label for="description">Description</label>
            <textarea 
              id="description"
              v-model="config.description" 
              rows="3"
            ></textarea>
          </div>

          <div class="form-group">
            <label for="type">Registry Type</label>
            <select id="type" v-model="config.type" disabled>
              <option value="wedding">Wedding Registry</option>
              <option value="clinical">Clinical Trial Registry</option>
              <option value="inventory">Inventory Registry</option>
              <option value="custom">Custom Registry</option>
            </select>
            <small class="form-hint">Registry type cannot be changed after creation.</small>
          </div>

          <button @click="saveBasicSettings" class="btn btn-primary" :disabled="saving">
            {{ saving ? 'Saving...' : 'Save Settings' }}
          </button>
        </div>

        <!-- Fields Configuration -->
        <div class="card">
          <h2>Fields Configuration</h2>
          <p class="config-desc">Define the fields for this registry type.</p>

          <div v-for="(field, index) in config.fields" :key="index" class="field-config">
            <div class="field-header">
              <h4>Field {{ index + 1 }}</h4>
              <button @click="removeField(index)" class="btn btn-danger btn-sm" v-if="config.fields.length > 1">Remove</button>
            </div>

            <div class="form-group">
              <label :for="`field-${index}-label`">Label</label>
              <input 
                :id="`field-${index}-label`"
                v-model="field.label" 
                type="text" 
                required
              />
            </div>

            <div class="form-group">
              <label :for="`field-${index}-name`">Field Name</label>
              <input 
                :id="`field-${index}-name`"
                v-model="field.name" 
                type="text" 
                required
              />
            </div>

            <div class="form-group">
              <label :for="`field-${index}-type`">Field Type</label>
              <select :id="`field-${index}-type`" v-model="field.type">
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
                <option value="select">Select (Dropdown)</option>
                <option value="boolean">Checkbox</option>
                <option value="textarea">Long Text</option>
              </select>
            </div>

            <div class="form-group">
              <label>
                <input type="checkbox" v-model="field.required" />
                Required
              </label>
            </div>

            <div v-if="field.type === 'select'" class="form-group">
              <label :for="`field-${index}-options`">Options (comma-separated)</label>
              <input 
                :id="`field-${index}-options`"
                v-model="field.optionsText" 
                type="text" 
                placeholder="Option 1, Option 2, Option 3"
              />
            </div>
          </div>

          <button @click="addField" class="btn btn-secondary">+ Add Field</button>
          <button @click="saveFields" class="btn btn-primary" :disabled="saving">
            {{ saving ? 'Saving...' : 'Save Fields' }}
          </button>
        </div>

        <!-- Settings -->
        <div class="card">
          <h2>Registry Settings</h2>

          <div class="form-group">
            <label>
              <input type="checkbox" v-model="config.settings.allowPublicView" />
              Allow public viewing
            </label>
          </div>

          <div class="form-group">
            <label>
              <input type="checkbox" v-model="config.settings.allowMultipleEntries" />
              Allow multiple entries per person
            </label>
          </div>

          <div class="form-group">
            <label>
              <input type="checkbox" v-model="config.settings.requireApproval" />
              Require approval for new entries
            </label>
          </div>

          <button @click="saveSettings" class="btn btn-primary" :disabled="saving">
            {{ saving ? 'Saving...' : 'Save Settings' }}
          </button>
        </div>

        <!-- Members -->
        <div class="card">
          <h2>Members</h2>
          <div v-if="members.length === 0" class="empty-state">
            <p>No members yet. Invite users to join.</p>
          </div>
          <div v-else class="members-list">
            <div v-for="member in members" :key="member._id" class="member-item">
              <div class="member-info">
                <strong>{{ member.name }}</strong>
                <span>{{ member.email }}</span>
              </div>
              <span class="badge" :class="getRoleBadge(member.role)">{{ member.role }}</span>
            </div>
          </div>
        </div>

        <!-- Co-Owners -->
        <div class="card">
          <h2>Co-Owners</h2>
          <p class="config-desc">Add co-owners who can also configure this registry.</p>
          
          <div class="form-group">
            <label for="coOwner">Add Co-Owner</label>
            <select id="coOwner" v-model="newCoOwner">
              <option value="">Select member...</option>
              <option v-for="member in members" :key="member._id" :value="member._id">
                {{ member.name }} ({{ member.email }})
              </option>
            </select>
          </div>

          <button @click="addCoOwner" class="btn btn-primary" :disabled="!newCoOwner || saving">
            {{ saving ? 'Adding...' : 'Add Co-Owner' }}
          </button>

          <div v-if="registry.coOwners?.length > 0" class="co-owners-list">
            <h4>Current Co-Owners:</h4>
            <div v-for="coOwnerId in registry.coOwners" :key="coOwnerId" class="member-item">
              <span>{{ getMemberName(coOwnerId) }}</span>
              <button @click="removeCoOwner(coOwnerId)" class="btn btn-danger btn-sm">Remove</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useAuthStore } from '../store/auth.js'
import { useRegistryStore } from '../store/registry.js'
import { db } from '../database/localStorage.js'
import { REGISTRY_TEMPLATES } from '../database/schema.js'

export default {
  name: 'RegistryConfigure',
  data() {
    return {
      loading: true,
      saving: false,
      registry: null,
      members: [],
      newCoOwner: '',
      config: {
        name: '',
        description: '',
        type: '',
        fields: [],
        settings: {
          allowPublicView: false,
          allowMultipleEntries: true,
          requireApproval: false
        }
      }
    }
  },
  async mounted() {
    await this.loadRegistry()
  },
  methods: {
    async loadRegistry() {
      const registry = useRegistryStore()
      await registry.loadRegistry(this.$route.params.id)
      
      this.registry = registry.currentRegistry
      this.config = {
        name: this.registry.name,
        description: this.registry.description || '',
        type: this.registry.type,
        fields: JSON.parse(JSON.stringify(this.registry.config?.fields || [])),
        settings: { ...this.registry.config?.settings }
      }

      // Add optionsText for select fields
      this.config.fields.forEach(field => {
        if (field.type === 'select' && field.options) {
          field.optionsText = field.options.join(', ')
        }
      })

      // Load members
      if (this.registry?.members) {
        const memberPromises = this.registry.members.map(id => db.findOne('users', { _id: id }))
        this.members = (await Promise.all(memberPromises)).filter(Boolean)
      }

      this.loading = false
    },

    addField() {
      this.config.fields.push({
        name: `field_${Date.now()}`,
        type: 'text',
        required: false,
        label: `Field ${this.config.fields.length + 1}`
      })
    },

    removeField(index) {
      this.config.fields.splice(index, 1)
    },

    async saveBasicSettings() {
      this.saving = true
      const registry = useRegistryStore()
      
      await registry.updateRegistry(this.registry._id, {
        name: this.config.name,
        description: this.config.description
      })

      this.saving = false
      alert('Settings saved!')
    },

    async saveFields() {
      this.saving = true
      const registry = useRegistryStore()
      
      // Process options for select fields
      const fields = this.config.fields.map(field => {
        const f = { ...field }
        if (f.type === 'select' && f.optionsText) {
          f.options = f.optionsText.split(',').map(o => o.trim()).filter(Boolean)
          delete f.optionsText
        }
        return f
      })

      await registry.updateRegistry(this.registry._id, {
        'config.fields': fields
      })

      this.saving = false
      alert('Fields saved!')
    },

    async saveSettings() {
      this.saving = true
      const registry = useRegistryStore()
      
      await registry.updateRegistry(this.registry._id, {
        'config.settings': this.config.settings
      })

      this.saving = false
      alert('Settings saved!')
    },

    async addCoOwner() {
      if (!this.newCoOwner) return
      
      this.saving = true
      const registry = useRegistryStore()
      
      const coOwners = [...(this.registry.coOwners || []), this.newCoOwner]
      
      await registry.updateRegistry(this.registry._id, {
        coOwners
      })

      this.newCoOwner = ''
      await this.loadRegistry()
      this.saving = false
    },

    async removeCoOwner(coOwnerId) {
      this.saving = true
      const registry = useRegistryStore()
      
      const coOwners = (this.registry.coOwners || []).filter(id => id !== coOwnerId)
      
      await registry.updateRegistry(this.registry._id, {
        coOwners
      })

      await this.loadRegistry()
      this.saving = false
    },

    getRoleBadge(role) {
      const badges = {
        owner: 'badge-primary',
        admin: 'badge-success',
        member: 'badge-warning',
        guest: 'badge-danger'
      }
      return badges[role] || 'badge-primary'
    },

    getMemberName(memberId) {
      const member = this.members.find(m => m._id === memberId)
      return member?.name || 'Unknown'
    }
  }
}
</script>

<style scoped>
.configure-page {
  padding: 20px 0;
}

.configure-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.configure-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}

.card {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.card h2 {
  margin-bottom: 15px;
  font-size: 1.3rem;
}

.config-desc {
  color: #666;
  margin-bottom: 15px;
}

.field-config {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
}

.field-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.field-header h4 {
  margin: 0;
}

.btn-sm {
  padding: 5px 10px;
  font-size: 0.85rem;
}

.members-list, .co-owners-list {
  margin-top: 15px;
}

.member-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 5px;
  margin-bottom: 8px;
}

.member-info {
  display: flex;
  flex-direction: column;
}

.member-info strong {
  font-size: 0.95rem;
}

.member-info span {
  font-size: 0.85rem;
  color: #666;
}

.co-owners-list h4 {
  margin-bottom: 10px;
}

.form-hint {
  display: block;
  margin-top: 5px;
  color: #999;
  font-size: 0.85rem;
}

@media (max-width: 768px) {
  .configure-grid {
    grid-template-columns: 1fr;
  }
  
  .configure-header {
    flex-direction: column;
    gap: 15px;
  }
}
</style>
