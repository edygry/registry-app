/**
 * NoSQL-inspired database schema for Multi-Tenant Registry App
 * 
 * This schema is designed for MongoDB/Firestore but implemented
 * with localStorage for the MVP.
 * 
 * Collections:
 * - tenants: Organization/workspace level
 * - users: Individual user accounts
 * - registries: Registry configurations
 * - registry_items: Items/fields in a registry
 * - records: Per-person data entries
 * - invitations: Pending invitations
 */

export const SCHEMA = {
  // TENANT COLLECTION
  // Each tenant is an independent workspace
  tenants: {
    _id: 'String (ObjectId)',
    name: 'String',
    slug: 'String (unique)',
    createdAt: 'Date',
    updatedAt: 'Date',
    settings: {
      maxRegistries: 'Number',
      maxUsers: 'Number',
      features: ['String']
    }
  },

  // USER COLLECTION
  // Users can belong to multiple tenants
  users: {
    _id: 'String (ObjectId)',
    tenantId: 'String (ref: tenants._id)',
    email: 'String',
    password: 'String (hashed, not stored in MVP)',
    name: 'String',
    role: 'String (owner | admin | member | guest)',
    registries: ['String (ref: registries._id)'],
    createdAt: 'Date',
    lastLogin: 'Date',
    profile: {
      phone: 'String',
      preferences: 'Object'
    }
  },

  // REGISTRY COLLECTION
  // Configurable registry definitions
  registries: {
    _id: 'String (ObjectId)',
    tenantId: 'String (ref: tenants._id)',
    name: 'String',
    type: 'String (wedding | clinical | inventory | custom)',
    ownerId: 'String (ref: users._id)',
    coOwners: ['String (ref: users._id)'],
    members: ['String (ref: users._id)'],
    config: {
      // Dynamic configuration based on registry type
      fields: [
        {
          name: 'String',
          type: 'String (text | number | date | select | boolean)',
          required: 'Boolean',
          options: ['String'], // for select type
          label: 'String'
        }
      ],
      settings: {
        allowPublicView: 'Boolean',
        allowMultipleEntries: 'Boolean',
        requireApproval: 'Boolean',
        notificationPreferences: 'Object'
      }
    },
    status: 'String (active | archived | draft)',
    createdAt: 'Date',
    updatedAt: 'Date'
  },

  // REGISTRY ITEMS COLLECTION
  // Items/fields that can be added to a registry
  registry_items: {
    _id: 'String (ObjectId)',
    registryId: 'String (ref: registries._id)',
    name: 'String',
    description: 'String',
    category: 'String',
    priority: 'Number',
    status: 'String (available | reserved | completed)',
    metadata: 'Object' // Type-specific metadata
  },

  // RECORDS COLLECTION
  // Per-person data entries
  records: {
    _id: 'String (ObjectId)',
    registryId: 'String (ref: registries._id)',
    personId: 'String (ref: users._id)', // The person the record is about
    enteredBy: 'String (ref: users._id)', // Who entered the record
    data: 'Object', // Dynamic data based on registry config
    status: 'String (pending | approved | rejected)',
    notes: 'String',
    createdAt: 'Date',
    updatedAt: 'Date'
  },

  // INVITATIONS COLLECTION
  // Pending invitations
  invitations: {
    _id: 'String (ObjectId)',
    registryId: 'String (ref: registries._id)',
    email: 'String',
    role: 'String (owner | admin | member | guest)',
    token: 'String (unique)',
    status: 'String (pending | accepted | expired)',
    invitedBy: 'String (ref: users._id)',
    createdAt: 'Date',
    expiresAt: 'Date'
  }
}

// Registry type templates
export const REGISTRY_TEMPLATES = {
  wedding: {
    name: 'Wedding Registry',
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
  clinical: {
    name: 'Clinical Trial Registry',
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
  inventory: {
    name: 'Inventory Registry',
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
}
