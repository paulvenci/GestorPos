<template>
  <Dialog
    v-model:visible="visible"
    modal
    header="Detalle de Venta"
    :style="{ width: '450px' }"
    :breakpoints="{ '1199px': '75vw', '575px': '95vw' }"
    class="pos-detalle-venta-dialog"
  >
    <div v-if="venta" class="ticket-container">
      <!-- Encabezado del Ticket -->
      <div class="ticket-header text-center mb-4">
        <h3 class="ticket-title font-bold text-xl uppercase tracking-tighter">GestorPOS</h3>
        <p class="text-[10px] text-muted font-mono mt-1">ID: {{ venta.idCorto }}</p>
        <p class="text-[11px] text-muted font-medium">{{ formatFecha(venta.fecha) }}</p>
        <div class="mt-2">
            <Tag
              :value="venta.estado === 'pendiente' ? 'LOCAL (SINCRONIZAR)' : 'SINCRONIZADO'"
              :severity="venta.estado === 'pendiente' ? 'warn' : 'success'"
              class="text-[9px] px-2 py-0"
              rounded
            />
        </div>
      </div>

      <!-- Datos del Cliente (si es Fiado) -->
      <div v-if="venta.esFiado" class="ticket-client-box p-3 rounded-xl mb-4 bg-amber-500/10 border border-amber-500/20">
        <div class="flex items-center gap-2 text-amber-500 font-bold mb-1 text-xs">
          <i class="pi pi-wallet"></i>
          <span>VENTA A CRÉDITO (FIADO)</span>
        </div>
        <p class="text-sm text-app">Cliente: <span class="font-bold underline">{{ venta.clienteNombre }}</span></p>
      </div>

      <Divider type="dashed" class="my-3" />

      <!-- Tabla de Items -->
      <div class="ticket-items">
        <div v-for="(item, idx) in venta.items" :key="idx" class="ticket-item-row flex justify-between py-2 text-sm border-b border-dashed border-slate-700/30 last:border-0 hover:bg-slate-500/5 px-1 rounded transition-colors">
          <div class="flex flex-col flex-1 min-w-0 pr-2">
            <span class="font-semibold text-app truncate">{{ item.nombre }}</span>
            <span class="text-[11px] text-muted">{{ item.cantidad }} x {{ formatMonto(item.precio_unitario) }}</span>
          </div>
          <div class="flex items-center font-mono font-bold text-app">
            {{ formatMonto(item.subtotal) }}
          </div>
        </div>
      </div>

      <Divider type="dashed" class="my-4" />

      <!-- Resumen de Totales -->
      <div class="ticket-totals space-y-2">
        <div class="flex justify-between items-center bg-slate-500/5 p-3 rounded-xl mb-3">
          <span class="text-xs font-bold text-muted uppercase tracking-widest">Total Cobrado</span>
          <span class="text-2xl font-black text-green-500">{{ formatMonto(venta.total) }}</span>
        </div>
        
        <div class="flex justify-between items-center text-xs px-2">
          <span class="text-muted">Método de Pago:</span>
          <span class="font-bold text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded uppercase">{{ venta.metodoEtiqueta }}</span>
        </div>

        <div v-if="!venta.esFiado" class="ticket-payments pt-2">
          <div class="flex justify-between text-xs px-2 py-1">
            <span class="text-muted">Monto Pagado:</span>
            <span class="font-medium text-app">{{ formatMonto(venta.pagado) }}</span>
          </div>
          <div v-if="venta.vuelto > 0" class="flex justify-between text-sm font-bold text-cyan-400 bg-cyan-400/10 p-2 rounded-lg mt-2">
            <span class="flex items-center gap-1"><i class="pi pi-reply text-xs"></i> Vuelto Entregado:</span>
            <span>{{ formatMonto(venta.vuelto) }}</span>
          </div>
        </div>
      </div>

      <div class="ticket-footer mt-6 pt-4 border-t border-dashed border-slate-700/50 text-center space-y-1">
        <p class="text-[10px] font-bold text-muted uppercase tracking-widest">Cajero: {{ venta.cajero }}</p>
        <div class="flex justify-center gap-1 opacity-40 py-2">
            <span v-for="i in 10" :key="i" class="w-1.5 h-1.5 bg-slate-500 rounded-full"></span>
        </div>
        <p class="text-[11px] font-bold text-app opacity-80 italic">¡Gracias por su compra!</p>
      </div>
    </div>

    <template #footer>
      <div class="flex gap-2 w-full mt-2">
         <Button label="Cerrar" text severity="secondary" @click="visible = false" class="flex-1" />
         <Button label="Imprimir Ticket" icon="pi pi-print" class="flex-1 pos-btn-cta" @click="$emit('reimprimir')" />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  venta: any;
  modelValue: boolean;
}>();

const emit = defineEmits(['update:modelValue', 'reimprimir']);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

function formatMonto(valor: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0
  }).format(valor || 0);
}

function formatFecha(fecha: any) {
  if (!fecha) return '';
  const date = new Date(fecha);
  return new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}
</script>

<style scoped>
.pos-detalle-venta-dialog :deep(.p-dialog-content) {
  padding: 1.5rem !important;
  border-bottom-left-radius: 1.5rem !important;
  border-bottom-right-radius: 1.5rem !important;
}

.pos-detalle-venta-dialog :deep(.p-dialog-header) {
  padding: 1.25rem 1.5rem 0.75rem !important;
}

.ticket-container {
  color: var(--text-app);
}

.text-muted {
  color: var(--text-muted);
}

.text-app {
  color: var(--text-app);
}

.pos-btn-cta {
  background: linear-gradient(135deg, #6366f1, #8b5cf6) !important;
  border: none !important;
  color: white !important;
}

/* Scrollbar personalizado para los items si hay muchos */
.ticket-items {
    max-height: 280px;
    overflow-y: auto;
    padding-right: 4px;
}

.ticket-items::-webkit-scrollbar {
  width: 4px;
}

.ticket-items::-webkit-scrollbar-track {
  background: transparent;
}

.ticket-items::-webkit-scrollbar-thumb {
  background: rgba(99, 102, 241, 0.2);
  border-radius: 10px;
}

.ticket-items::-webkit-scrollbar-thumb:hover {
  background: rgba(99, 102, 241, 0.4);
}
</style>
