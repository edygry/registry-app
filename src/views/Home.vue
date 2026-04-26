<template>
  <div class="home">
    <div class="hero">
      <h1>📋 Multi-Tenant Registry App</h1>
      <p class="subtitle">Configurable registries for any use case</p>
      <p class="description">From wedding registries to clinical trials - record data per person with flexible configurations.</p>
      
      <div class="actions">
        <router-link to="/register" class="btn btn-primary btn-lg">Get Started</router-link>
        <router-link to="/login" class="btn btn-secondary btn-lg">Sign In</router-link>
      </div>
    </div>

    <div class="features">
      <h2>Features</h2>
      <div class="grid">
        <div class="feature-card">
          <h3>🏢 Multi-Tenant</h3>
          <p>Independent workspaces with isolated data and configurations.</p>
        </div>
        <div class="feature-card">
          <h3>🎯 Variable Intake</h3>
          <p>Configure registries for weddings, clinical trials, inventory, or custom use cases.</p>
        </div>
        <div class="feature-card">
          <h3>👥 Per-Person Records</h3>
          <p>Track multiple entries per person - gifts, trials, or any custom data.</p>
        </div>
        <div class="feature-card">
          <h3>⚙️ Configurable</h3>
          <p>Each registry owner configures their own fields, settings, and workflows.</p>
        </div>
        <div class="feature-card">
          <h3>👤 Multiple Owners</h3>
          <p>Support for multiple registry owners with role-based access control.</p>
        </div>
        <div class="feature-card">
          <h3>📧 Invitations</h3>
          <p>Invite users to registries with simulated invitation flow.</p>
        </div>
      </div>
    </div>

    <div class="use-cases">
      <h2>Use Cases</h2>
      <div class="grid">
        <div class="use-case-card">
          <h3>💒 Wedding Registry</h3>
          <p>Track wedding gifts, preferences, and purchases. Multiple guests can contribute.</p>
          <ul>
            <li>Gift items with prices and URLs</li>
            <li>Priority levels</li>
            <li>Quantity tracking</li>
            <li>Guest contributions</li>
          </ul>
        </div>
        <div class="use-case-card">
          <h3>🔬 Clinical Trials</h3>
          <p>Manage patient data across multiple clinical trials with approval workflows.</p>
          <ul>
            <li>Patient enrollment tracking</li>
            <li>Trial phase management</li>
            <li>Approval workflows</li>
            <li>Clinical notes</li>
          </ul>
        </div>
        <div class="use-case-card">
          <h3>📦 Inventory</h3>
          <p>Track inventory items, quantities, and locations across multiple warehouses.</p>
          <ul>
            <li>SKU tracking</li>
            <li>Location management</li>
            <li>Quantity alerts</li>
            <li>Update history</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="tech-stack">
      <h2>Tech Stack</h2>
      <div class="tech-grid">
        <div class="tech-item">
          <h4>Vue 3 + Vite</h4>
          <p>Modern, fast frontend framework</p>
        </div>
        <div class="tech-item">
          <h4>NoSQL Schema</h4>
          <p>Document-based data model (localStorage → MongoDB/Firestore)</p>
        </div>
        <div class="tech-item">
          <h4>Multi-Tenant</h4>
          <p>Isolated workspaces with shared infrastructure</p>
        </div>
        <div class="tech-item">
          <h4>Role-Based Access</h4>
          <p>Owner, Admin, Member, Guest roles</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Home'
}
</script>

<style scoped>
.home {
  padding: 40px 0;
}

.hero {
  text-align: center;
  padding: 60px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 15px;
  margin-bottom: 40px;
}

.hero h1 {
  font-size: 2.5rem;
  margin-bottom: 15px;
}

.subtitle {
  font-size: 1.3rem;
  opacity: 0.9;
  margin-bottom: 10px;
}

.description {
  font-size: 1.1rem;
  opacity: 0.8;
  max-width: 600px;
  margin: 0 auto 30px;
}

.actions {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.btn-lg {
  padding: 12px 30px;
  font-size: 1.1rem;
}

.features, .use-cases, .tech-stack {
  margin-bottom: 40px;
}

h2 {
  font-size: 2rem;
  margin-bottom: 20px;
  text-align: center;
}

.feature-card, .use-case-card, .tech-item {
  background: white;
  padding: 25px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.feature-card h3, .use-case-card h3, .tech-item h4 {
  margin-bottom: 10px;
  color: #667eea;
}

.use-case-card ul {
  margin-top: 15px;
  padding-left: 20px;
}

.use-case-card li {
  margin-bottom: 5px;
  color: #666;
}

.tech-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

@media (max-width: 768px) {
  .hero h1 {
    font-size: 2rem;
  }
  
  .actions {
    flex-direction: column;
  }
}
</style>
