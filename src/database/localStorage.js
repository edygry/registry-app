/**
 * Local Storage Database Adapter
 * 
 * Implements NoSQL-like operations using localStorage.
 * Designed to be easily replaceable with MongoDB/Firestore.
 */

const DB_PREFIX = 'registry_app_'

class LocalDatabase {
  constructor() {
    this.collections = {}
    this._init()
  }

  _init() {
    // Load all collections from localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key.startsWith(DB_PREFIX)) {
        const collection = key.replace(DB_PREFIX, '')
        try {
          this.collections[collection] = JSON.parse(localStorage.getItem(key))
        } catch (e) {
          this.collections[collection] = []
        }
      }
    }
  }

  _save(collection) {
    localStorage.setItem(DB_PREFIX + collection, JSON.stringify(this.collections[collection] || []))
  }

  _generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  // CRUD Operations
  async find(collection, query = {}) {
    if (!this.collections[collection]) {
      this.collections[collection] = []
    }
    
    let results = this.collections[collection]
    
    // Apply query filters
    for (const [key, value] of Object.entries(query)) {
      results = results.filter(doc => {
        if (typeof value === 'object' && value !== null) {
          // Support $gt, $lt, $in, etc.
          if (value.$gt) return doc[key] > value.$gt
          if (value.$lt) return doc[key] < value.$lt
          if (value.$in) return value.$in.includes(doc[key])
          if (value.$regex) return new RegExp(value.$regex).test(doc[key])
        }
        return doc[key] === value
      })
    }
    
    return results
  }

  async findOne(collection, query) {
    const results = await this.find(collection, query)
    return results[0] || null
  }

  async insertOne(collection, document) {
    if (!this.collections[collection]) {
      this.collections[collection] = []
    }
    
    const doc = {
      _id: this._generateId(),
      ...document,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    this.collections[collection].push(doc)
    this._save(collection)
    
    return doc
  }

  async insertMany(collection, documents) {
    const inserted = []
    for (const doc of documents) {
      const insertedDoc = await this.insertOne(collection, doc)
      inserted.push(insertedDoc)
    }
    return inserted
  }

  async updateOne(collection, query, update) {
    const docs = await this.find(collection, query)
    if (docs.length === 0) return null
    
    const doc = docs[0]
    const updated = {
      ...doc,
      ...update,
      _id: doc._id,
      createdAt: doc.createdAt,
      updatedAt: new Date().toISOString()
    }
    
    const index = this.collections[collection].findIndex(d => d._id === doc._id)
    this.collections[collection][index] = updated
    this._save(collection)
    
    return updated
  }

  async deleteOne(collection, query) {
    const docs = await this.find(collection, query)
    if (docs.length === 0) return false
    
    const doc = docs[0]
    this.collections[collection] = this.collections[collection].filter(d => d._id !== doc._id)
    this._save(collection)
    
    return true
  }

  async count(collection, query = {}) {
    const results = await this.find(collection, query)
    return results.length
  }

  // Seed data for MVP
  async seed() {
    // Check if already seeded
    const tenants = await this.find('tenants')
    if (tenants.length > 0) return

    // Create default tenant
    const tenant = await this.insertOne('tenants', {
      name: 'Default Workspace',
      slug: 'default',
      settings: {
        maxRegistries: 10,
        maxUsers: 50,
        features: ['all']
      }
    })

    // Create registry templates
    await this.insertMany('registry_templates', [
      {
        type: 'wedding',
        name: 'Wedding Registry',
        description: 'Track wedding gifts and preferences',
        fields: [
          { name: 'item', type: 'text', required: true, label: 'Gift Item' },
          { name: 'price', type: 'number', required: false, label: 'Price' },
          { name: 'url', type: 'text', required: false, label: 'Purchase URL' },
          { name: 'priority', type: 'select', required: true, options: ['High', 'Medium', 'Low'], label: 'Priority' },
          { name: 'quantity', type: 'number', required: true, label: 'Quantity Needed' }
        ],
        settings: {
          allowPublicView: true,
          allowMultipleEntries: false,
          requireApproval: false
        }
      },
      {
        type: 'clinical',
        name: 'Clinical Trial Registry',
        description: 'Manage clinical trial patient data',
        fields: [
          { name: 'patientId', type: 'text', required: true, label: 'Patient ID' },
          { name: 'trialName', type: 'text', required: true, label: 'Trial Name' },
          { name: 'phase', type: 'select', required: true, options: ['Phase I', 'Phase II', 'Phase III', 'Phase IV'], label: 'Trial Phase' },
          { name: 'enrollmentDate', type: 'date', required: true, label: 'Enrollment Date' },
          { name: 'status', type: 'select', required: true, options: ['Active', 'Completed', 'Withdrawn', 'Terminated'], label: 'Status' },
          { name: 'notes', type: 'text', required: false, label: 'Clinical Notes' }
        ],
        settings: {
          allowPublicView: false,
          allowMultipleEntries: true,
          requireApproval: true
        }
      },
      {
        type: 'inventory',
        name: 'Inventory Registry',
        description: 'Track inventory items and quantities',
        fields: [
          { name: 'itemName', type: 'text', required: true, label: 'Item Name' },
          { name: 'sku', type: 'text', required: false, label: 'SKU' },
          { name: 'quantity', type: 'number', required: true, label: 'Quantity' },
          { name: 'location', type: 'text', required: false, label: 'Location' },
          { name: 'lastUpdated', type: 'date', required: false, label: 'Last Updated' }
        ],
        settings: {
          allowPublicView: false,
          allowMultipleEntries: true,
          requireApproval: false
        }
      }
    ])

    console.log('Database seeded successfully')
  }
}

// Singleton instance
export const db = new LocalDatabase()
