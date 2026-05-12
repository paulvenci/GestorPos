<template>
  <div class="ayuda-container">
    <div class="construction-card">
      <div class="icon-wrapper">
        <i class="pi pi-cog spin-slow"></i>
        <i class="pi pi-wrench tool-bounce"></i>
      </div>
      <h1>Sección en Construcción</h1>
      <p>Estamos trabajando para brindarte las mejores guías y tutoriales. Muy pronto tendrás todo el contenido disponible aquí.</p>
      <div class="loader-bar"></div>
    </div>
  </div>
</template>

<style scoped>
.ayuda-container {
  min-height: calc(100vh - 100px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.construction-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 1.5rem;
  padding: 3rem 2rem;
  max-width: 500px;
  width: 100%;
  text-align: center;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.icon-wrapper {
  position: relative;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
}

.icon-wrapper .pi-cog {
  font-size: 5rem;
  color: var(--color-brand-primary);
  opacity: 0.2;
}

.icon-wrapper .pi-wrench {
  position: absolute;
  font-size: 2.5rem;
  color: var(--color-brand-primary);
}

.spin-slow {
  animation: spin 8s linear infinite;
}

.tool-bounce {
  animation: bounce 2s ease-in-out infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0) rotate(-15deg); }
  50% { transform: translateY(-10px) rotate(15deg); }
}

h1 {
  font-size: 2rem;
  font-weight: 800;
  color: var(--text-app);
  margin: 0;
  letter-spacing: -0.02em;
}

p {
  color: var(--text-muted);
  font-size: 1.1rem;
  line-height: 1.6;
  margin: 0;
}

.loader-bar {
  height: 6px;
  width: 100%;
  background: var(--border-subtle);
  border-radius: 10px;
  position: relative;
  overflow: hidden;
}

.loader-bar::after {
  content: '';
  position: absolute;
  left: -50%;
  height: 100%;
  width: 50%;
  background: linear-gradient(90deg, transparent, var(--color-brand-primary), transparent);
  animation: loading 2s infinite linear;
}

@keyframes loading {
  from { left: -50%; }
  to { left: 100%; }
}
</style>
