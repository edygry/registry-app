<template>
  <div class="registry-view">
    <div v-if="loading" class="loading">Loading registry...</div>

    <div v-else-if="!registry" class="error">
      <h2>Registry not found</h2>
      <router-link to="/dashboard" class="btn btn-primary">Back to Dashboard</router-link>
    </div>

    <div v-else>
      <div class="registry-header">
        <div>
          <h1>{{ registry.name }}</h1>
          <div class="registry-meta">
            <span class="badge" :class="getTypeBadge(registry.type)">{{ registry.type }}</span>
            <span>👤 {{ registry.members?.length || 0 }} members</span>
            <span>📝 {{ records.length }} records</span>
          </div>
        </div>
        <div class="registry-actions">
          <router-link v-if="canEdit" :to="`/registry/${registry._id}/configure`" class="btn btn-secondary">Configure</router-link>
          <router-link :to="`/registry/${registry._id}/records`" class="btn btn-secondary">All Records</router-link>
          <button @click="showAddRecord = true" class="btn btn-primary">+ Add Record</button>
        </div>
      </div>

      <div v-if="registry.description" class="registry-description">
        <p>{{ registry.description }}</p>
      </div>

      <!-- Records Table -->
      <div class="records-section">
        <h2>Records</h2>

        <div v-if="records.length === 0" class="empty-state">
          <p>No records yet. Add your first record.</p>
        </div>

        <div v-else class="records-table">
          <table>
            <thead>
              <tr>
                <th>Person</th>
                <th v-for="field in registry.config?.fields || []" :key="field.name">
                  {{ field.label }}
                </th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="record in records" :key="record._id">
                <td>{{ getPersonName(record.personId) }}</td>
                <td v-for="field in registry.config?.fields || []" :key="field.name">
                  {{ record.data?.[field.name] || '-' }}
                </td>
                <td>
                  <span class="badge" :class="getStatusBadge(record.status)">
                    {{ record.status }}
                  </span>
                </td>
                <td>
                  <button @click="editRecord(record)" class="btn btn-secondary btn-sm">Edit</button>
                  <button @click="deleteRecord(record._id)" class="btn btn-danger btn-sm">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add Record Modal -->
      <div v-if="showAddRecord" class="modal-overlay" @click.self="showAddRecord = false">
        <div class="modal">
          <div class="modal-header">
            <h2>Add New Record</h2>
            <button @click="showAddRecord = false" class="modal-close">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label for="personId">Person</label>
              <select id="personId" v-model="newRecord.personId" required>
                <option value="">Select person...</option>
                <option v-for="member in registry.members" :key="member" :value="member">
                  {{ getPersonName(member) }}
                </option>
              </select>
            </div>

            <div v-for="field in registry.config?.fields || []" :key="field.name" class="form-group">
              <label :for="field.name">{{ field.label }} {{ field.required ? '*' : '' }}</label>
              
              <input 
                v-if="field.type === 'text' || field.type === 'number'"
                :id="field.name"
                v-model="newRecord.data[field.name]"
                :type="field.type"
                :required="field.required"
                :placeholder="field.label"
              />
              
              <select 
                v-else-if="field.type === 'select'"
                :id="field.name"
                v-model="newRecord.data[field.name]"
                :required="field.required"
              >
                <option value="">Select...</option>
                <option v-for="option in field.options" :key="option" :value="option">
                  {{ option }}
                </option>
              </select>
              
              <input 
                v-else-if="field.type === 'date'"
                :id="field.name"
                v-model="newRecord.data[field.name]"
                type="date"
                :required="field.required"
              />
              
              <input 
                v-else-if="field.type === 'boolean'"
                :id="field.name"
                v-model="newRecord.data[field.name]"
                type="checkbox"
              />
              
              <textarea 
                v-else
                :id="field.name"
                v-model="newRecord.data[field.name]"
                :required="field.required"
                :placeholder="field.label"
                rows="3"
              ></textarea>
            </div>

            <div class="form-group">
              <label for="notes">Notes</label>
              <textarea 
                id="notes"
                v-model="newRecord.notes" 
                rows="2"
                placeholder="Optional notes"
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button @click="showAddRecord = false" class="btn btn-secondary">Cancel</button>
            <button @click="addRecord" class="btn btn-primary" :disabled="adding">
              {{ adding ? 'Adding...' : 'Add Record' }}
            </button>
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

export default {
  name: 'RegistryView',
  data() {
    return {
      loading: true,
      adding: false,
      registry: null,
      records: [],
      showAddRecord: false,
      newRecord: {
        personId: '',
        data: {},
        notes: ''
      },
      members: []
    }
  },
  computed: {
    canEdit() {
      const auth = useAuthStore()
      if (!this.registry) return false
      return this.registry.ownerId === auth.user?._id ||
             this.registry.coOwners?.includes(auth.user?._id) ||
             auth.user?.role === 'admin'
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
      this.records = registry.records
      
      // Load members
      if (this.registry?.members) {
        const memberPromises = this.registry.members.map(id => db.findOne('users', { _id: id }))
        this.members = (await Promise.all(memberPromises)).filter(Boolean)
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

    getStatusBadge(status) {
      const badges = {
        pending: 'badge-warning',
        approved: 'badge-success',
        rejected: 'badge-danger'
      }
      return badges[status] || 'badge-primary'
    },

    getPersonName(personId) {
      const member = this.members.find(m => m._id === personId)
      return member?.name || 'Unknown'
    },

    async addRecord() {
      if (!this.newRecord.personId) return
      
      this.adding = true
      const registry = useRegistryStore()
      
      await registry.addRecord(
        this.registry._id,
        this.newRecord.personId,
        this.newRecord.data
      )

      this.showAddRecord = false
      this.newRecord = { personId: '', data: {}, notes: '' }
      await this.loadRegistry()
      this.adding = false
    },

    editRecord(record) {
      this.newRecord = {
        personId: record.personId,
        data: { ...record.data },
        notes: record.notes || ''
      }
      this.showAddRecord = true
    },

    async deleteRecord(recordId) {
      if (!confirm('Are you sure you want to delete this record?')) return
      
      const registry = useRegistryStore()
      await registry.deleteRecord(recordId)
      await this.loadRegistry()
    }
  }
}
</script>

<style scoped>
.registry-view {
  padding: 20px 0;
}

.registry-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.registry-header h1 {
  margin-bottom: 10px;
}

.registry-meta {
  display: flex;
  gap: 15px;
  color: #666;
  font-size: 0.9rem;
}

.registry-description {
  background: white;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  color: #666;
}

.registry-actions {
  display: flex;
  gap: 10px;
}

.records-section {
  margin-top: 30px;
}

.records-section h2 {
  margin-bottom: 15px;
}

.records-table {
  overflow-x: auto;
}

table {
  width: 100%;
  background: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

th {
  background: #667eea;
  color: white;
}

.btn-sm {
  padding: 5px 10px;
  font-size: 0.85rem;
  margin-right: 5px;
}

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
  max-width: 600px;
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

@media (max-width: 768px) {
  .registry-header {
    flex-direction: column;
    gap: 15px;
  }
  
  .registry-actions {
    flex-wrap: wrap;
  }
}
</style>
