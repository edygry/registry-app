<template>
  <div class="records-page">
    <div v-if="loading" class="loading">Loading records...</div>

    <div v-else-if="!registry" class="error">
      <h2>Registry not found</h2>
      <router-link to="/dashboard" class="btn btn-primary">Back to Dashboard</router-link>
    </div>

    <div v-else>
      <div class="records-header">
        <div>
          <h1>📝 Records: {{ registry.name }}</h1>
          <p class="records-count">{{ records.length }} records</p>
        </div>
        <div class="records-actions">
          <router-link :to="`/registry/${registry._id}`" class="btn btn-secondary">Back to Registry</router-link>
          <button @click="showAddRecord = true" class="btn btn-primary">+ Add Record</button>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters">
        <div class="form-group">
          <label for="filterPerson">Filter by Person</label>
          <select id="filterPerson" v-model="filterPerson">
            <option value="">All Persons</option>
            <option v-for="member in members" :key="member._id" :value="member._id">
              {{ member.name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="filterStatus">Filter by Status</label>
          <select id="filterStatus" v-model="filterStatus">
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <!-- Records Table -->
      <div class="records-table">
        <table>
          <thead>
            <tr>
              <th>Person</th>
              <th v-for="field in registry.config?.fields || []" :key="field.name">
                {{ field.label }}
              </th>
              <th>Status</th>
              <th>Entered By</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="record in filteredRecords" :key="record._id">
              <td>{{ getPersonName(record.personId) }}</td>
              <td v-for="field in registry.config?.fields || []" :key="field.name">
                {{ record.data?.[field.name] || '-' }}
              </td>
              <td>
                <span class="badge" :class="getStatusBadge(record.status)">
                  {{ record.status }}
                </span>
              </td>
              <td>{{ getEnteredByName(record.enteredBy) }}</td>
              <td>{{ formatDate(record.createdAt) }}</td>
              <td>
                <button @click="editRecord(record)" class="btn btn-secondary btn-sm">Edit</button>
                <button v-if="canApprove" @click="approveRecord(record)" class="btn btn-success btn-sm">Approve</button>
                <button v-if="canApprove" @click="rejectRecord(record)" class="btn btn-danger btn-sm">Reject</button>
                <button @click="deleteRecord(record._id)" class="btn btn-danger btn-sm">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="filteredRecords.length === 0" class="empty-state">
          <p>No records match your filters.</p>
        </div>
      </div>

      <!-- Add/Edit Record Modal -->
      <div v-if="showAddRecord" class="modal-overlay" @click.self="showAddRecord = false">
        <div class="modal">
          <div class="modal-header">
            <h2>{{ editingRecord ? 'Edit Record' : 'Add New Record' }}</h2>
            <button @click="showAddRecord = false" class="modal-close">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label for="personId">Person</label>
              <select id="personId" v-model="recordForm.personId" required>
                <option value="">Select person...</option>
                <option v-for="member in members" :key="member" :value="member">
                  {{ getPersonName(member) }}
                </option>
              </select>
            </div>

            <div v-for="field in registry.config?.fields || []" :key="field.name" class="form-group">
              <label :for="field.name">{{ field.label }} {{ field.required ? '*' : '' }}</label>
              
              <input 
                v-if="field.type === 'text' || field.type === 'number'"
                :id="field.name"
                v-model="recordForm.data[field.name]"
                :type="field.type"
                :required="field.required"
              />
              
              <select 
                v-else-if="field.type === 'select'"
                :id="field.name"
                v-model="recordForm.data[field.name]"
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
                v-model="recordForm.data[field.name]"
                type="date"
                :required="field.required"
              />
              
              <textarea 
                v-else
                :id="field.name"
                v-model="recordForm.data[field.name]"
                :required="field.required"
                rows="3"
              ></textarea>
            </div>

            <div class="form-group">
              <label for="notes">Notes</label>
              <textarea 
                id="notes"
                v-model="recordForm.notes" 
                rows="2"
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button @click="showAddRecord = false" class="btn btn-secondary">Cancel</button>
            <button @click="saveRecord" class="btn btn-primary" :disabled="saving">
              {{ saving ? 'Saving...' : 'Save Record' }}
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
  name: 'RegistryRecords',
  data() {
    return {
      loading: true,
      saving: false,
      registry: null,
      records: [],
      members: [],
      filterPerson: '',
      filterStatus: '',
      showAddRecord: false,
      editingRecord: null,
      recordForm: {
        personId: '',
        data: {},
        notes: ''
      }
    }
  },
  computed: {
    filteredRecords() {
      let filtered = [...this.records]
      
      if (this.filterPerson) {
        filtered = filtered.filter(r => r.personId === this.filterPerson)
      }
      
      if (this.filterStatus) {
        filtered = filtered.filter(r => r.status === this.filterStatus)
      }
      
      return filtered
    },
    canApprove() {
      const auth = useAuthStore()
      return this.registry?.ownerId === auth.user?._id || 
             this.registry?.coOwners?.includes(auth.user?._id) ||
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

    getEnteredByName(enteredById) {
      const member = this.members.find(m => m._id === enteredById)
      return member?.name || 'Unknown'
    },

    formatDate(date) {
      return new Date(date).toLocaleDateString()
    },

    editRecord(record) {
      this.editingRecord = record
      this.recordForm = {
        personId: record.personId,
        data: { ...record.data },
        notes: record.notes || ''
      }
      this.showAddRecord = true
    },

    async saveRecord() {
      if (!this.recordForm.personId) return
      
      this.saving = true
      const registry = useRegistryStore()
      
      if (this.editingRecord) {
        await registry.updateRecord(this.editingRecord._id, {
          personId: this.recordForm.personId,
          data: this.recordForm.data,
          notes: this.recordForm.notes
        })
      } else {
        await registry.addRecord(
          this.registry._id,
          this.recordForm.personId,
          this.recordForm.data
        )
      }

      this.showAddRecord = false
      this.editingRecord = null
      this.recordForm = { personId: '', data: {}, notes: '' }
      await this.loadRegistry()
      this.saving = false
    },

    async approveRecord(record) {
      const registry = useRegistryStore()
      await registry.updateRecord(record._id, { status: 'approved' })
      await this.loadRegistry()
    },

    async rejectRecord(record) {
      const registry = useRegistryStore()
      await registry.updateRecord(record._id, { status: 'rejected' })
      await this.loadRegistry()
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
.records-page {
  padding: 20px 0;
}

.records-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.records-count {
  color: #666;
  margin-top: 5px;
}

.records-actions {
  display: flex;
  gap: 10px;
}

.filters {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
  background: white;
  padding: 15px;
  border-radius: 8px;
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
  .records-header {
    flex-direction: column;
    gap: 15px;
  }
  
  .records-actions {
    flex-wrap: wrap;
  }
}
</style>
