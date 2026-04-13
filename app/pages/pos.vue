<template>
  <div class="pos-layout">

    <!-- ═══ PANEL IZQUIERDO: Búsqueda y productos ═══ -->
    <div class="pos-panel-left">

      <!-- Barra de búsqueda (auto-focus para scanner) -->
      <div class="pos-search-bar">
        <div class="pos-search-input-wrap">
          <div class="p-inputgroup flex-1">
            <InputText
              ref="searchInputRef"
              id="pos-busqueda-principal"
              v-model="posStore.busqueda"
              placeholder="Escanear código o buscar por nombre..."
              class="pos-search-input"
              autocomplete="off"
              @input="onBusqueda"
              @keydown.enter="onEnterBusqueda"
              @keydown.escape="limpiarBusqueda"
            />
            <Button icon="pi pi-camera" class="pos-scan-btn" severity="secondary" text @click="abrirScanner" title="Escanear código de barras" />
          </div>
          <span v-if="posStore.buscando" class="pos-search-spinner">
            <i class="pi pi-spin pi-spinner" />
          </span>
        </div>
        <Button
          icon="pi pi-tag"
          label="Consultar (F3)"
          class="pos-consulta-btn"
          severity="secondary"
          @click="abrirConsultaGlobal"
        />
      </div>

        <!-- Badge offline -->
        <div v-if="!isOnline" class="pos-offline-badge">
          <i class="pi pi-wifi-off" />
          Modo Offline
        </div>

      <div class="pos-resultados-area">
        <div v-if="!posStore.busqueda && topVendidos.length > 0" class="pos-catalogo pos-catalogo--top">
          <h3 class="pos-catalogo-title">Top 10 más vendidos</h3>
          <div class="pos-catalogo-grid">
            <button
              v-for="item in topVendidos"
              :key="item.id"
              class="pos-catalogo-item"
              :disabled="!item.es_pesable && item.stock === 0"
              @click="seleccionarProducto(item)"
            >
              <img v-if="item.imagen_url" :src="item.imagen_url" class="pos-catalogo-img" alt="" />
              <div v-else class="pos-catalogo-img pos-catalogo-img--empty">
                <i class="pi pi-box" />
              </div>
              <span class="pos-catalogo-nombre">{{ item.nombre }}</span>
              <span class="pos-catalogo-precio">{{ formatMonto(item.precio) }}</span>
            </button>
          </div>
        </div>

        <!-- Resultados de búsqueda -->
        <Transition name="slide-down">
          <div v-if="posStore.resultados.length > 0" class="pos-resultados">
            <div
              v-for="(prod, idx) in posStore.resultados"
              :key="prod.id"
              class="pos-resultado-item"
              :class="{ 'pos-resultado-item--first': idx === 0 }"
              tabindex="0"
              @click="seleccionarProducto(prod)"
              @keydown.enter="seleccionarProducto(prod)"
            >
              <img v-if="prod.imagen_url" :src="prod.imagen_url" class="pos-resultado-thumb" alt="" />
              <div v-else class="pos-resultado-thumb pos-resultado-thumb--empty">
                <i class="pi pi-box" />
              </div>
              <div class="pos-resultado-info">
                <span class="pos-resultado-nombre">{{ prod.nombre }}</span>
                <span class="pos-resultado-sku">{{ prod.sku }}</span>
              </div>
              <div class="pos-resultado-derecha">
                <span class="pos-resultado-precio">{{ formatMonto(prod.precio) }}</span>
                <Tag
                  v-if="prod.es_pesable"
                  value="A granel"
                  severity="info"
                  class="pos-resultado-stock"
                />
                <Tag
                  v-else
                  :value="`Stock: ${prod.stock}`"
                  :severity="prod.stock > 0 ? 'success' : 'danger'"
                  class="pos-resultado-stock"
                />
              </div>
            </div>
          </div>
        </Transition>

        <div v-if="posStore.busqueda && !posStore.buscando && posStore.resultados.length === 0" class="pos-vacio">
          <i class="pi pi-search-minus" style="font-size: 2rem; color: #64748b;" />
          <p>No se encontraron productos para tu búsqueda</p>
        </div>

      </div>
    </div>

    <!-- ═══ PANEL DERECHO: Carrito ═══ -->
    <div class="pos-panel-right">

      <!-- Header del carrito -->
      <div class="pos-carrito-header">
        <h2 class="pos-carrito-title">
          <i class="pi pi-shopping-cart" />
          Carrito
          <span v-if="posStore.carrito.length > 0" class="pos-carrito-badge">
            {{ posStore.carrito.length }}
          </span>
        </h2>
        <div class="pos-carrito-acciones">
          <Button
            v-if="posStore.carrito.length > 0"
            icon="pi pi-pause"
            text
            severity="warn"
            size="small"
            title="Reservar venta (F4)"
            @click="reservarVentaActual"
          />
          <Button
            v-if="posStore.ventasReservadas.length > 0"
            :label="String(posStore.ventasReservadas.length)"
            icon="pi pi-bookmark"
            text
            severity="info"
            size="small"
            :badge="String(posStore.ventasReservadas.length)"
            badgeSeverity="warn"
            title="Ver ventas reservadas"
            class="pos-reservas-btn"
            @click="mostrarReservas = true"
          />
          <Button
            icon="pi pi-ban"
            text
            severity="danger"
            size="small"
            title="Cancelar una venta del día"
            @click="abrirCancelarVenta"
          />
          <Button
            v-if="posStore.carrito.length > 0"
            icon="pi pi-trash"
            text
            severity="danger"
            size="small"
            title="Vaciar carrito (Esc)"
            @click="confirmarVaciar"
          />
        </div>
      </div>

      <!-- Ítems del carrito -->
      <div class="pos-carrito-items">
        <TransitionGroup name="cart-item" tag="div">
          <div
            v-for="item in posStore.carrito"
            :key="item.id_producto"
            class="pos-item"
          >
            <div class="pos-item-info">
              <span class="pos-item-nombre">{{ item.nombre }}</span>
              <span class="pos-item-sku">{{ item.sku }}</span>
            </div>

            <div class="pos-item-controles">
              <button v-if="!item.es_pesable" class="pos-item-btn" @click="posStore.setCantidad(item.id_producto, item.cantidad - 1)">
                <i class="pi pi-minus" />
              </button>
              <span class="pos-item-cantidad">{{ item.es_pesable ? item.cantidad.toFixed(3) + ' kg' : item.cantidad }}</span>
              <button v-if="!item.es_pesable" class="pos-item-btn" @click="posStore.setCantidad(item.id_producto, item.cantidad + 1)">
                <i class="pi pi-plus" />
              </button>
            </div>

            <div class="pos-item-precio-col">
              <span class="pos-item-precio">{{ formatMonto(redondearCLP(item.precio * item.cantidad * (1 - item.descuento / 100))) }}</span>
              <button class="pos-item-eliminar" @click="posStore.quitarItem(item.id_producto)">
                <i class="pi pi-times" />
              </button>
            </div>
          </div>
        </TransitionGroup>

        <!-- Carrito vacío -->
        <div v-if="posStore.carrito.length === 0" class="pos-carrito-vacio">
          <i class="pi pi-shopping-bag" />
          <p>El carrito está vacío</p>
        </div>
      </div>

      <!-- Footer: Total y cobro -->
      <div class="pos-carrito-footer">
        <div class="pos-total-row">
          <span class="pos-total-label">Total</span>
          <span class="pos-total-monto">{{ formatMonto(posStore.total) }}</span>
        </div>

        <!-- Método de pago -->
        <div class="pos-metodo-pago">
          <button
            v-for="metodo in metodosPago"
            :key="metodo.value"
            class="pos-metodo-btn"
            :class="{ 'pos-metodo-btn--activo': metodoPago === metodo.value }"
            @click="metodoPago = metodo.value"
          >
            <i :class="metodo.icon" />
            {{ metodo.label }}
          </button>
        </div>

        <Button
          label="Cobrar (F11/F12)"
          icon="pi pi-check-circle"
          size="large"
          class="pos-cobrar-btn"
          :loading="posStore.procesando"
          :disabled="posStore.carrito.length === 0"
          @click="cobrar"
        />
      </div>
    </div>
  </div>

  <!-- Diálogo de confirmación de pago -->
  <Dialog
    v-model:visible="mostrarConfirmacion"
    modal
    header="Confirmar Venta"
    :style="{ width: '430px' }"
    :closable="false"
    :focusOnShow="false"
    @show="onMostrarModalCobro"
    @hide="onCerrarModalCobro"
  >
    <div class="dialog-body">
      <div class="confirm-estado">
        <Tag
          :value="ventaActualGuardada ? 'VENTA GUARDADA' : 'VENTA PENDIENTE'"
          :severity="ventaActualGuardada ? 'success' : 'warn'"
        />
        <span v-if="ventaActualGuardada" class="confirm-estado-text">
          ID {{ ventaActualIdCorto }} · {{ ventaActualImpresa ? 'impresa' : 'sin imprimir' }}
        </span>
      </div>

      <div class="confirm-total">
        <span class="confirm-total-label">Total a cobrar</span>
        <span class="confirm-total-monto">{{ formatMonto(totalCobroActual) }}</span>
      </div>

      <div class="confirm-pagos">
        <div class="confirm-pago-row">
          <label>Efectivo</label>
          <InputNumber ref="pagoEfectivoRef" inputId="pos-pago-efectivo" v-model="pagoEfectivo" mode="currency" currency="CLP" locale="es-CL" :maxFractionDigits="0" :min="0" class="w-full" @focus="seleccionarTextoPago" />
        </div>
        <div class="confirm-pago-row">
          <label>Tarjeta</label>
          <InputNumber ref="pagoTarjetaRef" inputId="pos-pago-tarjeta" v-model="pagoTarjeta" mode="currency" currency="CLP" locale="es-CL" :maxFractionDigits="0" :min="0" class="w-full" @focus="seleccionarTextoPago" />
        </div>
        <div class="confirm-pago-row">
          <label>Transferencia</label>
          <InputNumber ref="pagoTransferenciaRef" inputId="pos-pago-transferencia" v-model="pagoTransferencia" mode="currency" currency="CLP" locale="es-CL" :maxFractionDigits="0" :min="0" class="w-full" @focus="seleccionarTextoPago" />
        </div>
      </div>

      <div class="confirm-resumen-pago">
        <div class="confirm-resumen-row">
          <span>Pagado</span>
          <strong>{{ formatMonto(totalPagado) }}</strong>
        </div>
        <div v-if="saldoPendiente > 0" class="confirm-resumen-row confirm-resumen-row--warn">
          <span>Pendiente</span>
          <strong>{{ formatMonto(saldoPendiente) }}</strong>
        </div>
        <div v-else-if="saldoPendiente === 0" class="confirm-resumen-row confirm-resumen-row--ok">
          <span>Pago exacto</span>
          <strong>✓</strong>
        </div>
        <div v-else class="confirm-resumen-row confirm-vuelto">
          <span>VUELTO</span>
          <strong>{{ formatMonto(Math.abs(saldoPendiente)) }}</strong>
        </div>
      </div>
    </div>
    <template #footer>
      <Button :label="ventaActualGuardada ? 'Cerrar (Esc)' : 'Cancelar (Esc)'" text severity="secondary" @click="mostrarConfirmacion = false" />
      <Button
        label="Guardar (F2)"
        icon="pi pi-save"
        :loading="posStore.procesando || confirmandoCobro"
        :disabled="confirmandoCobro || !pagoValido || ventaActualGuardada"
        severity="secondary"
        outlined
        @click="confirmarCobro(false)"
      />
      <Button
        :label="ventaActualGuardada ? 'Reimprimir (F1)' : 'Guardar e Imprimir (F1)'"
        :icon="ventaActualGuardada ? 'pi pi-print' : 'pi pi-check'"
        :loading="posStore.procesando || confirmandoCobro"
        :disabled="confirmandoCobro || (!pagoValido && !ventaActualGuardada)"
        class="pos-btn-cta"
        @click="confirmarCobro(true)"
      />
    </template>
  </Dialog>

  <!-- Modal Modalidad de Peso -->
  <Dialog v-model:visible="mostrarModalPeso" header="Producto por Peso" :modal="true" :style="{ width: '400px' }" :closable="false" :focusOnShow="false" @show="enfocarCampoPeso" @hide="cerrarModalPeso">
    <div class="p-2 flex flex-col gap-4">
      <div>
         <h3 class="font-bold text-lg text-slate-800 dark:text-white">{{ productoPendientePeso?.nombre }}</h3>
         <p class="text-slate-500 text-sm">Precio por Kg/Base: {{ formatMonto(productoPendientePeso?.precio || 0) }}</p>
      </div>
      <div>
         <label class="block text-sm font-medium mb-1">Ingresar Peso (Kg)</label>
         <InputNumber
           ref="pesoInputRef"
           inputId="pos-peso-cantidad"
           v-model="cantidadPesoCalculada"
           locale="en-US"
           :useGrouping="false"
           :minFractionDigits="3"
           :maxFractionDigits="3"
           :step="0.05"
           class="w-full"
           @update:modelValue="onCambioPeso"
           @keydown.enter="confirmarPesoDesdeTeclado"
         />
      </div>
      <div>
         <label class="block text-sm font-medium mb-1">Ingresar Precio Total</label>
         <InputNumber
           ref="precioTotalPesoRef"
           inputId="pos-precio-total-peso"
           v-model="precioPesadoCalculado"
           mode="currency"
           currency="CLP"
           locale="es-CL"
           :maxFractionDigits="0"
           class="w-full"
           @update:modelValue="onCambioTotal"
           @keydown.enter="confirmarPesoDesdeTeclado"
         />
      </div>
      <div class="pos-peso-total-box">
         <span class="block text-xs uppercase pos-peso-total-label mb-1">Total a cobrar</span>
         <span class="text-2xl font-black pos-peso-total-value">{{ formatMonto(totalPesoCalculado) }}</span>
      </div>
    </div>
    <template #footer>
      <Button label="Cancelar" text severity="secondary" @click="cerrarModalPeso" />
      <Button label="Agregar" icon="pi pi-check" @click="confirmarPeso" :disabled="totalPesoCalculado <= 0 || !cantidadPesoCalculada || cantidadPesoCalculada <= 0" />
    </template>
  </Dialog>

  <!-- Modal Autorización PIN -->
  <Dialog v-model:visible="mostrarModalAuth" header="Autorización Requerida" :modal="true" :style="{ width: '350px' }" @hide="authPin = ''">
    <div class="p-2 flex flex-col gap-3">
      <p class="text-sm text-slate-500">Un supervisor o administrador debe ingresar su PIN para autorizar la creación de productos.</p>
      <div class="p-inputgroup mt-2">
         <InputText v-model="authPin" type="password" placeholder="Ingresar PIN" @keydown.enter="validarPin" autofocus />
         <Button icon="pi pi-unlock" @click="validarPin" :loading="validandoPin" />
      </div>
    </div>
  </Dialog>

  <!-- Modal Producto Rápido (Tras Autorización) -->
  <Dialog v-model:visible="mostrarModalNuevoProd" header="Crear Producto Rápido" :modal="true" :style="{ width: '450px' }">
    <div class="flex flex-col gap-4 p-2">
      <div class="field">
         <label class="block text-sm mb-1">Nombre</label>
         <InputText v-model="nuevoProdRapido.nombre" class="w-full" autofocus />
      </div>
      <div class="field">
         <label class="block text-sm mb-1">Código (SKU)</label>
         <InputText v-model="nuevoProdRapido.sku" class="w-full" placeholder="Generado automático si se deja en blanco" />
      </div>
      <div class="grid grid-cols-2 gap-4">
         <div class="field">
           <label class="block text-sm mb-1">Costo</label>
           <InputNumber v-model="nuevoProdRapido.costo" mode="currency" currency="CLP" locale="es-CL" :maxFractionDigits="0" class="w-full" />
         </div>
         <div class="field">
           <label class="block text-sm mb-1">Precio de Venta</label>
           <InputNumber v-model="nuevoProdRapido.precio" mode="currency" currency="CLP" locale="es-CL" :maxFractionDigits="0" class="w-full" />
         </div>
      </div>
    </div>
    <template #footer>
      <Button label="Cancelar" text @click="mostrarModalNuevoProd = false" />
      <Button label="Crear y Agregar" icon="pi pi-plus" @click="crearProductoRapido" :loading="creandoProd" />
    </template>
  </Dialog>

  <!-- Modal Scanner -->
  <Dialog v-model:visible="mostrarScanner" header="Escanear Código" :modal="true" :style="{ width: '400px' }" @hide="cerrarScanner">
    <div class="flex flex-col items-center justify-center p-2">
      <div class="relative w-full rounded overflow-hidden bg-black aspect-video flex items-center justify-center">
        <video ref="videoScannerRef" class="w-full h-full object-cover" autoplay muted playsinline></video>
        <div class="absolute inset-x-4 top-1/2 h-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse"></div>
      </div>
      <p class="mt-4 text-center text-sm text-slate-500">Apunta la cámara al código de barras.</p>
    </div>
  </Dialog>

  <!-- Dialog Ventas Reservadas -->
  <Dialog
    v-model:visible="mostrarReservas"
    modal
    header="Ventas Reservadas"
    :style="{ width: '460px' }"
  >
    <div v-if="posStore.ventasReservadas.length === 0" class="pos-reservas-vacio">
      <i class="pi pi-bookmark" style="font-size: 2rem; color: #64748b;" />
      <p>No hay ventas reservadas</p>
    </div>
    <div v-else class="pos-reservas-lista">
      <div
        v-for="reserva in posStore.ventasReservadas"
        :key="reserva.id"
        class="pos-reserva-item"
      >
        <div class="pos-reserva-info">
          <span class="pos-reserva-items-count">
            <i class="pi pi-shopping-cart" />
            {{ reserva.items.length }} producto{{ reserva.items.length > 1 ? 's' : '' }}
          </span>
          <span class="pos-reserva-total">{{ formatMonto(reserva.total) }}</span>
          <span class="pos-reserva-tiempo">{{ tiempoDesde(reserva.created_at) }}</span>
        </div>
        <div class="pos-reserva-acciones">
          <Button
            label="Retomar"
            icon="pi pi-play"
            size="small"
            severity="success"
            @click="retomarVentaReservada(reserva.id!)"
          />
          <Button
            icon="pi pi-trash"
            size="small"
            severity="danger"
            text
            @click="posStore.eliminarReserva(reserva.id!)"
          />
        </div>
      </div>
    </div>
  </Dialog>

  <!-- Modal: Cancelar Venta del Día -->
  <Dialog
    v-model:visible="mostrarModalCancelar"
    modal
    header="Cancelar una Venta"
    :style="{ width: '600px' }"
    @hide="resetCancelarVenta"
  >
    <!-- Paso 1: Listado de ventas -->
    <div v-if="!ventaSeleccionadaCancelar" class="flex flex-col gap-3">
      <p class="text-sm text-slate-500">Selecciona la venta del día que deseas cancelar. El stock de los productos será repuesto automáticamente.</p>
      <div v-if="cargandoVentasDia" class="flex justify-center p-6">
        <i class="pi pi-spin pi-spinner" style="font-size:2rem" />
      </div>
      <div v-else-if="ventasDia.length === 0" class="text-center text-slate-500 py-6">
        <i class="pi pi-check-circle" style="font-size:2rem" />
        <p class="mt-2">No hay ventas del día disponibles para cancelar.</p>
      </div>
      <div v-else class="flex flex-col gap-2 max-h-80 overflow-y-auto">
        <div
          v-for="venta in ventasDia"
          :key="venta.id"
          class="border border-slate-200 rounded-lg p-3 cursor-pointer hover:border-red-400 hover:bg-red-50 transition-colors"
          @click="ventaSeleccionadaCancelar = venta"
        >
          <div class="flex justify-between items-center">
            <div class="flex flex-col gap-0.5">
              <span class="font-semibold text-slate-800">{{ formatMonto(venta.total) }}</span>
              <span class="text-xs text-slate-500">
                {{ new Date(venta.fecha).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) }}
                &bull; {{ venta.metodo_pago }}
                &bull; {{ venta.detalle_ventas?.length || 0 }} producto(s)
              </span>
            </div>
            <i class="pi pi-chevron-right text-slate-400" />
          </div>
        </div>
      </div>
    </div>

    <!-- Paso 2: Detalle + motivo + PIN -->
    <div v-else class="flex flex-col gap-4">
      <!-- Botón volver -->
      <Button
        label="Volver al listado"
        icon="pi pi-arrow-left"
        text
        severity="secondary"
        size="small"
        @click="ventaSeleccionadaCancelar = null; errorCancelar = ''"
      />

      <!-- Resumen de la venta -->
      <div class="border border-slate-200 rounded-lg p-3 bg-slate-50">
        <div class="flex justify-between mb-2">
          <span class="text-sm font-semibold text-slate-700">Detalle de la venta</span>
          <span class="text-sm font-bold text-slate-900">{{ formatMonto(ventaSeleccionadaCancelar.total) }}</span>
        </div>
        <ul class="text-sm text-slate-600 space-y-1">
          <li
            v-for="det in ventaSeleccionadaCancelar.detalle_ventas"
            :key="det.id_producto"
            class="flex justify-between"
          >
            <span>{{ det.productos?.nombre || 'Producto' }} × {{ det.cantidad }}</span>
            <span>{{ formatMonto(det.precio_unitario * det.cantidad) }}</span>
          </li>
        </ul>
      </div>

      <!-- Motivo -->
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium text-slate-700">Motivo de cancelación <span class="text-slate-400 font-normal">(opcional)</span></label>
        <Textarea
          v-model="motivoCancelar"
          rows="2"
          placeholder="Ej: Producto devuelto, error en el cobro..."
          class="w-full"
        />
      </div>

      <!-- Autenticación del supervisor -->
      <div class="border border-amber-200 bg-amber-50 rounded-lg p-3 flex flex-col gap-2">
        <span class="text-sm font-medium text-amber-800">
          <i class="pi pi-lock mr-1" />
          Se requiere autorización de supervisor o administrador
        </span>
        <InputText
          v-model="emailSupervisor"
          type="email"
          placeholder="Email del supervisor"
          class="w-full"
        />
        <Password
          v-model="passwordSupervisor"
          placeholder="Contraseña del supervisor"
          :feedback="false"
          toggleMask
          class="w-full"
          inputClass="w-full"
        />
        <small v-if="errorCancelar" class="text-red-600">{{ errorCancelar }}</small>
      </div>
    </div>

    <template #footer>
      <Button label="Cerrar" text severity="secondary" @click="mostrarModalCancelar = false" />
      <Button
        v-if="ventaSeleccionadaCancelar"
        label="Confirmar Cancelación"
        icon="pi pi-ban"
        severity="danger"
        :loading="cancelandoVenta"
        :disabled="!emailSupervisor || !passwordSupervisor"
        @click="confirmarCancelarVenta"
      />
    </template>
  </Dialog>

</template>

<script setup lang="ts">
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '~/stores/auth'
import { useCajaStore } from '~/stores/caja'
import { usePosStore, redondearCLP } from '~/stores/pos'
import { useFormatMonto } from '~/composables/useFormatMonto'
import { db } from '~/db'
import type { ProductoLocal } from '~/db'
import type { Database } from '~/types/database.types'
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser'
import { BarcodeFormat, DecodeHintType } from '@zxing/library'

const authStore = useAuthStore()
const cajaStore = useCajaStore()
const posStore = usePosStore()
const toast = useToast()
const { formatMonto } = useFormatMonto()
const supabase = useSupabaseClient<Database>()
const consultaPrecioVisible = useState<boolean>('consulta-precio-open', () => false)
const ultimosToasts = new Map<string, number>()

function addToastUnico(
  payload: { severity: string; summary: string; detail: string; life?: number },
  key?: string,
  ventanaMs = 1500
) {
  const k = key || `${payload.severity}|${payload.summary}|${payload.detail}`
  const now = Date.now()
  const prev = ultimosToasts.get(k) || 0
  if (now - prev < ventanaMs) return
  ultimosToasts.set(k, now)
  toast.add(payload)
}

// ─── Refs ─────────────────────────────────────────────────
const searchInputRef = ref<any>(null)

/** Resuelve el <input> nativo dentro del InputText de PrimeVue y le da foco */
function enfocarBusqueda() {
  nextTick(() => {
    window.setTimeout(() => {
      const el = searchInputRef.value
      if (!el) return
      // InputText de PrimeVue expone $el (el input nativo)
      const input: HTMLInputElement | null =
        document.getElementById('pos-busqueda-principal') as HTMLInputElement | null ||
        el.$el ||
        el
      if (input && typeof input.focus === 'function') {
        input.focus()
        input.select?.()
      }
    }, 15)
  })
}
const pagoEfectivoRef = ref<any>(null)
const pagoTarjetaRef = ref<any>(null)
const pagoTransferenciaRef = ref<any>(null)
const mostrarConfirmacion = ref(false)
const confirmandoCobro = ref(false)
const metodoPago = ref('efectivo')
const pagoEfectivo = ref(0)
const pagoTarjeta = ref(0)
const pagoTransferencia = ref(0)
const totalCobroModal = ref(0)
const itemsCobroModal = ref<TicketItem[]>([])
const ventaActualGuardada = ref(false)
const ventaActualImpresa = ref(false)
const ventaActualId = ref<string | null>(null)
const ventaActualEstado = ref<'emitido' | 'pendiente' | null>(null)
const ventaActualFecha = ref<Date | null>(null)
const ventaActualMetodoEtiqueta = ref('')
const ventaActualCajero = ref('')
const ventaActualPagado = ref(0)
const ventaActualVuelto = ref(0)
const isOnline = ref(import.meta.client ? navigator.onLine : true)
const topVendidos = ref<ProductoLocal[]>([])
const mostrarReservas = ref(false)
const onDesconectado = () => { isOnline.value = false }

// ─── Cancelar Venta ───────────────────────────────────────
const mostrarModalCancelar = ref(false)
const ventasDia = ref<any[]>([])
const ventaSeleccionadaCancelar = ref<any>(null)
const motivoCancelar = ref('')
const emailSupervisor = ref('')
const passwordSupervisor = ref('')
const cancelandoVenta = ref(false)
const cargandoVentasDia = ref(false)
const errorCancelar = ref('')

async function abrirCancelarVenta() {
  ventaSeleccionadaCancelar.value = null
  motivoCancelar.value = ''
  emailSupervisor.value = ''
  passwordSupervisor.value = ''
  errorCancelar.value = ''
  mostrarModalCancelar.value = true
  cargandoVentasDia.value = true
  try {
    ventasDia.value = await posStore.fetchVentasDia()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las ventas del día', life: 3000 })
  } finally {
    cargandoVentasDia.value = false
  }
}

function resetCancelarVenta() {
  ventaSeleccionadaCancelar.value = null
  motivoCancelar.value = ''
  emailSupervisor.value = ''
  passwordSupervisor.value = ''
  errorCancelar.value = ''
  ventasDia.value = []
}

async function confirmarCancelarVenta() {
  if (!ventaSeleccionadaCancelar.value || !emailSupervisor.value || !passwordSupervisor.value) return
  cancelandoVenta.value = true
  errorCancelar.value = ''
  try {
    // 1. Autenticar al supervisor
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: emailSupervisor.value,
      password: passwordSupervisor.value
    })
    if (authError || !authData?.user) {
      errorCancelar.value = 'Credenciales incorrectas. Intenta nuevamente.'
      return
    }

    // 2. Verificar rol del supervisor
    const { data: perfil, error: perfilError } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', authData.user.id)
      .single()

    if (perfilError || !perfil || !['admin', 'supervisor'].includes(perfil.rol)) {
      errorCancelar.value = 'El usuario no tiene permisos de supervisor o administrador.'
      return
    }

    // 3. Ejecutar la cancelación
    await posStore.cancelarVenta(
      ventaSeleccionadaCancelar.value.id,
      motivoCancelar.value || null,
      authData.user.id
    )

    toast.add({ severity: 'success', summary: 'Venta cancelada', detail: 'La venta fue cancelada y el stock fue repuesto.', life: 4000 })
    mostrarModalCancelar.value = false
    resetCancelarVenta()
  } catch (err: any) {
    errorCancelar.value = err.message || 'No se pudo cancelar la venta.'
  } finally {
    cancelandoVenta.value = false
  }
}

const metodosPago = [
  { value: 'efectivo', label: 'Efectivo (F12)', icon: 'pi pi-money-bill' },
  { value: 'tarjeta', label: 'Tarjeta (F11)', icon: 'pi pi-credit-card' },
  { value: 'transferencia', label: 'Transferencia', icon: 'pi pi-send' }
]

const totalPagado = computed(() =>
  (Number(pagoEfectivo.value) || 0) +
  (Number(pagoTarjeta.value) || 0) +
  (Number(pagoTransferencia.value) || 0)
)

const totalCobroActual = computed(() => mostrarConfirmacion.value ? totalCobroModal.value : posStore.total)
const saldoPendiente = computed(() => Math.round((totalCobroActual.value - totalPagado.value)))
const pagoValido = computed(() => totalCobroActual.value > 0 && saldoPendiente.value <= 0 && totalPagado.value > 0)
const ventaActualIdCorto = computed(() => String(ventaActualId.value || '').slice(0, 8).toUpperCase() || 'N/A')
const cleanupPagoInputListeners: Array<() => void> = []

type TicketItem = {
  nombre: string
  sku: string
  cantidad: number
  precio: number
  descuento: number
  subtotal: number
}

function construirItemsTicketDesdeCarrito() {
  return posStore.carrito.map((item) => ({
    nombre: item.nombre,
    sku: item.sku,
    cantidad: item.cantidad,
    precio: item.precio,
    descuento: item.descuento,
    subtotal: redondearCLP(item.precio * item.cantidad * (1 - item.descuento / 100))
  }))
}

function resetEstadoCobro() {
  totalCobroModal.value = 0
  itemsCobroModal.value = []
  ventaActualGuardada.value = false
  ventaActualImpresa.value = false
  ventaActualId.value = null
  ventaActualEstado.value = null
  ventaActualFecha.value = null
  ventaActualMetodoEtiqueta.value = ''
  ventaActualCajero.value = ''
  ventaActualPagado.value = 0
  ventaActualVuelto.value = 0
  pagoEfectivo.value = 0
  pagoTarjeta.value = 0
  pagoTransferencia.value = 0
}

function enfocarBusquedaPrincipalPOS() {
  enfocarBusqueda()
}

function onCerrarModalCobro() {
  limpiarListenersInputsPago()
  resetEstadoCobro()
  enfocarBusquedaPrincipalPOS()
}

function onMostrarModalCobro() {
  instalarListenersInputsPago()
  enfocarCampoPagoSeleccionado()
}

function obtenerInputRefSegunMetodo() {
  if (metodoPago.value === 'tarjeta') return pagoTarjetaRef
  if (metodoPago.value === 'transferencia') return pagoTransferenciaRef
  return pagoEfectivoRef
}

function enfocarCampoPagoSeleccionado() {
  const inputId =
    metodoPago.value === 'tarjeta'
      ? 'pos-pago-tarjeta'
      : metodoPago.value === 'transferencia'
        ? 'pos-pago-transferencia'
        : 'pos-pago-efectivo'

  nextTick(() => {
    window.setTimeout(() => {
      const inputRef = obtenerInputRefSegunMetodo()
      const input =
        document.getElementById(inputId) as HTMLInputElement | null ||
        inputRef.value?.$el?.querySelector?.('input') ||
        inputRef.value?.input ||
        null

      if (input && typeof input.focus === 'function') {
        input.focus()
        seleccionarInputCompleto(input)
      }
    }, 30)
  })
}

function seleccionarInputCompleto(input: HTMLInputElement) {
  const aplicar = () => {
    if (typeof input.focus === 'function') input.focus()
    if (typeof input.select === 'function') input.select()
    if (typeof input.setSelectionRange === 'function') {
      input.setSelectionRange(0, input.value.length)
    }
  }

  aplicar()
  requestAnimationFrame(aplicar)
  window.setTimeout(aplicar, 0)
  window.setTimeout(aplicar, 40)
}

function seleccionarTextoPago(event: Event) {
  const input = event.target as HTMLInputElement | null
  if (!input) return
  seleccionarInputCompleto(input)
}

function obtenerInputPagoPorCampo(campo: 'efectivo' | 'tarjeta' | 'transferencia') {
  const id =
    campo === 'tarjeta'
      ? 'pos-pago-tarjeta'
      : campo === 'transferencia'
        ? 'pos-pago-transferencia'
        : 'pos-pago-efectivo'

  return document.getElementById(id) as HTMLInputElement | null
}

function obtenerOrdenCampoPago() {
  return ['efectivo', 'tarjeta', 'transferencia'] as const
}

function setMontoPago(campo: 'efectivo' | 'tarjeta' | 'transferencia', valor: number) {
  const monto = Number.isFinite(valor) ? Math.max(0, Math.round(valor)) : 0
  if (campo === 'efectivo') pagoEfectivo.value = monto
  else if (campo === 'tarjeta') pagoTarjeta.value = monto
  else pagoTransferencia.value = monto
}

function parsearMontoDesdeInput(valor: string) {
  const limpio = String(valor || '').replace(/[^\d-]/g, '')
  if (!limpio || limpio === '-') return 0
  return Number(limpio)
}

function sincronizarMontoPagoDesdeInput(campo: 'efectivo' | 'tarjeta' | 'transferencia') {
  const input = obtenerInputPagoPorCampo(campo)
  if (!input) return
  setMontoPago(campo, parsearMontoDesdeInput(input.value))
}

function moverFocoCampoPago(campoActual: 'efectivo' | 'tarjeta' | 'transferencia', direccion: 1 | -1) {
  const orden = obtenerOrdenCampoPago()
  const actualIndex = orden.indexOf(campoActual)
  const siguienteIndex = actualIndex + direccion
  if (siguienteIndex < 0 || siguienteIndex >= orden.length) return
  const siguienteCampo = orden[siguienteIndex]
  metodoPago.value = siguienteCampo
  const input = obtenerInputPagoPorCampo(siguienteCampo)
  if (!input) return
  seleccionarInputCompleto(input)
}

function limpiarListenersInputsPago() {
  while (cleanupPagoInputListeners.length > 0) {
    const cleanup = cleanupPagoInputListeners.pop()
    cleanup?.()
  }
}

function instalarListenersInputsPago() {
  limpiarListenersInputsPago()

  const campos = obtenerOrdenCampoPago()
  window.setTimeout(() => {
    for (const campo of campos) {
      const input = obtenerInputPagoPorCampo(campo)
      if (!input) continue

      const onInput = () => sincronizarMontoPagoDesdeInput(campo)
      const onFocus = () => { metodoPago.value = campo }
      const onKeyup = () => sincronizarMontoPagoDesdeInput(campo)
      const onKeydown = (event: KeyboardEvent) => {
        if (event.key === 'ArrowDown') {
          event.preventDefault()
          event.stopPropagation()
          moverFocoCampoPago(campo, 1)
          return
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault()
          event.stopPropagation()
          moverFocoCampoPago(campo, -1)
          return
        }
        window.setTimeout(() => sincronizarMontoPagoDesdeInput(campo), 0)
      }

      input.addEventListener('input', onInput)
      input.addEventListener('focus', onFocus)
      input.addEventListener('keyup', onKeyup)
      input.addEventListener('keydown', onKeydown, true)

      cleanupPagoInputListeners.push(() => input.removeEventListener('input', onInput))
      cleanupPagoInputListeners.push(() => input.removeEventListener('focus', onFocus))
      cleanupPagoInputListeners.push(() => input.removeEventListener('keyup', onKeyup))
      cleanupPagoInputListeners.push(() => input.removeEventListener('keydown', onKeydown, true))
    }
  }, 30)
}

// ─── Inicialización ───────────────────────────────────────
onMounted(async () => {
  await cajaStore.fetchTurnoActivo()
  await posStore.sincronizarCatalogo()
  await posStore.cargarReservas()
  await cargarTopVendidos()

  // Auto-focus en el input de búsqueda
  enfocarBusqueda()

  // Monitorear estado de red
  window.addEventListener('online', onConectado)
  window.addEventListener('offline', onDesconectado)
})

onUnmounted(() => {
  window.removeEventListener('online', onConectado)
  window.removeEventListener('offline', onDesconectado)
})

async function cargarTopVendidos() {
  try {
    const { data: topData, error } = await supabase.rpc('get_top_productos', { dias_historial: 30 })
    if (error || !topData?.length) {
      topVendidos.value = []
      return
    }

    const idsTop = (topData as Array<{ producto_id: string }>).map((p) => p.producto_id)
    const catalogo = await db.productos.toArray()
    const byId = new Map(catalogo.map((p) => [p.id, p]))
    topVendidos.value = idsTop
      .map((id) => byId.get(id))
      .filter((p): p is ProductoLocal => !!p)
      .slice(0, 10)
  } catch {
    topVendidos.value = []
  }
}

async function onConectado() {
  isOnline.value = true
  await sincronizarColaOffline()
}

// ─── Búsqueda ─────────────────────────────────────────────
async function onBusqueda() {
  const consultaEnCurso = posStore.busqueda
  await posStore.buscarProductos(posStore.busqueda)
  
  // Condición antimultiplicidad: si la búsqueda se limpió (por ej. por un Enter simultaneo) no seguimos
  if (posStore.busqueda !== consultaEnCurso) return
  
  // Agregar automáticamente si hay una coincidencia exacta de SKU
  if (posStore.busqueda) {
    const q = posStore.busqueda.toLowerCase()
    const exactMatch = posStore.resultados.find(p => p.sku && p.sku.toLowerCase() === q)
    if (exactMatch) {
      seleccionarProducto(exactMatch)
    }
  }
}

async function onEnterBusqueda() {
  const consultaEnCurso = posStore.busqueda
  if (!consultaEnCurso) return

  await posStore.buscarProductos(posStore.busqueda)

  // Condición antimultiplicidad: evitar que se agregue de nuevo si onBusqueda ya lo procesó y limpió el input
  if (posStore.busqueda !== consultaEnCurso) return

  if (posStore.resultados.length === 1) {
    const prod = posStore.resultados[0]
    if (prod) {
      seleccionarProducto(prod)
    }
  }
}

function limpiarSoloBusqueda() {
  posStore.busqueda = ''
  posStore.resultados.length = 0
}

function limpiarBusqueda() {
  const algunModalAbierto = mostrarConfirmacion.value || 
                            mostrarModalPeso.value || 
                            mostrarScanner.value || 
                            mostrarReservas.value || 
                            mostrarModalAuth.value || 
                            mostrarModalNuevoProd.value || 
                            consultaPrecioVisible.value;

  if (algunModalAbierto) {
    return
  }

  limpiarSoloBusqueda()
}

function abrirConsultaGlobal() {
  consultaPrecioVisible.value = true
}

// ─── Lógica Producto por Peso ────────
const mostrarModalPeso = ref(false)
const productoPendientePeso = ref<ProductoLocal | null>(null)
const cantidadPesoCalculada = ref(0)
const precioPesadoCalculado = ref(0)
const pesoInputRef = ref<any>(null)
const precioTotalPesoRef = ref<any>(null)
let origenEdicionPeso: 'peso' | 'total' | null = null

const totalPesoCalculado = computed(() => Math.max(0, precioPesadoCalculado.value || 0))

function redondearKg(value: number) {
  return Math.round(value * 1000) / 1000
}

function redondearClp(value: number) {
  return Math.round(value)
}

function onCambioPeso(value: number | null | undefined) {
  if (!productoPendientePeso.value || origenEdicionPeso === 'total') return
  origenEdicionPeso = 'peso'
  const peso = Math.max(0, Number(value) || 0)
  cantidadPesoCalculada.value = redondearKg(peso)
  precioPesadoCalculado.value = redondearClp(productoPendientePeso.value.precio * cantidadPesoCalculada.value)
  origenEdicionPeso = null
}

function onCambioTotal(value: number | null | undefined) {
  if (!productoPendientePeso.value || origenEdicionPeso === 'peso') return
  origenEdicionPeso = 'total'
  const total = Math.max(0, Number(value) || 0)
  precioPesadoCalculado.value = redondearClp(total)
  const precioBase = Number(productoPendientePeso.value.precio) || 0
  cantidadPesoCalculada.value = precioBase > 0 ? redondearKg(precioPesadoCalculado.value / precioBase) : 0
  origenEdicionPeso = null
}

const ultimoProductoAgregado = ref<{ id: string, timestamp: number } | null>(null)

function seleccionarProducto(prod: ProductoLocal) {
  // Evitar doble escaneo hiper r\u00e1pido del mismo producto (lectores en modo continuo)
  const ahora = Date.now()
  if (
    ultimoProductoAgregado.value && 
    ultimoProductoAgregado.value.id === prod.id && 
    (ahora - ultimoProductoAgregado.value.timestamp) < 400
  ) {
    // Ignoramos la selecci\u00f3n si pasaron menos de 400ms para el MISMO producto
    return
  }

  if (prod.es_pesable) {
    productoPendientePeso.value = prod
    cantidadPesoCalculada.value = 1
    precioPesadoCalculado.value = redondearClp(prod.precio * cantidadPesoCalculada.value)
    mostrarModalPeso.value = true
    return
  }

  if (prod.stock === 0) {
    toast.add({ severity: 'warn', summary: 'Sin stock', detail: `"${prod.nombre}" no tiene stock disponible`, life: 3000 })
    return
  }

  posStore.agregarItem(prod)
  ultimoProductoAgregado.value = { id: prod.id, timestamp: ahora }
  posStore.busqueda = ''
  posStore.resultados = []
  enfocarBusqueda()
  playBeep()
}

function enfocarCampoPeso() {
  nextTick(() => {
    window.setTimeout(() => {
      const input =
        document.getElementById('pos-precio-total-peso') as HTMLInputElement | null ||
        precioTotalPesoRef.value?.$el?.querySelector?.('input') ||
        precioTotalPesoRef.value?.input ||
        null

      if (input && typeof input.focus === 'function') {
        input.focus()
        if (typeof input.select === 'function') input.select()
      }
    }, 30)
  })
}

function confirmarPesoDesdeTeclado(event?: KeyboardEvent) {
  event?.preventDefault()
  if (totalPesoCalculado.value <= 0 || !cantidadPesoCalculada.value || cantidadPesoCalculada.value <= 0) return
  confirmarPeso()
}

function confirmarPeso() {
  if (productoPendientePeso.value && cantidadPesoCalculada.value > 0) {
     posStore.agregarItem(productoPendientePeso.value, cantidadPesoCalculada.value, productoPendientePeso.value.precio)
     playBeep()
  }
  cerrarModalPeso()
  enfocarBusqueda()
}

function cerrarModalPeso() {
  mostrarModalPeso.value = false
  productoPendientePeso.value = null
  cantidadPesoCalculada.value = 0
  precioPesadoCalculado.value = 0
  origenEdicionPeso = null
}

function playBeep() {
  try {
    const ctx = new AudioContext()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    oscillator.frequency.setValueAtTime(880, ctx.currentTime)
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
    oscillator.start()
    oscillator.stop(ctx.currentTime + 0.1)
  } catch (_) {}
}

// ─── Lógica Scanner ───
const mostrarScanner = ref(false)
const videoScannerRef = ref<HTMLVideoElement | null>(null)
let codeReader: BrowserMultiFormatReader | null = null
let activeStream: MediaStream | null = null
let scannerControls: IScannerControls | null = null
let detectorInterval: ReturnType<typeof setInterval> | null = null
let scannerResultadoProcesado = false

async function abrirScanner() {
  if (mostrarScanner.value) return
  scannerResultadoProcesado = false

  mostrarScanner.value = true
  await nextTick()
  
  if (!codeReader) {
    const hints = new Map()
    const formats = [
      BarcodeFormat.CODE_128,
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.QR_CODE,
      BarcodeFormat.CODE_39,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.ITF,
      BarcodeFormat.CODABAR,
      BarcodeFormat.CODE_93
    ]
    hints.set(DecodeHintType.POSSIBLE_FORMATS, formats)
    hints.set(DecodeHintType.TRY_HARDER, true)
    codeReader = new BrowserMultiFormatReader(hints, {
      delayBetweenScanAttempts: 100,
      delayBetweenScanSuccess: 500,
      tryPlayVideoTimeout: 5000
    })
  }
  
  if (!videoScannerRef.value) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo inicializar el visor de cámara', life: 3000 })
    cerrarScanner()
    return
  }

  try {
    scannerControls = await codeReader.decodeFromConstraints(
      {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      },
      videoScannerRef.value,
      (result, error) => {
        if (result && mostrarScanner.value) {
          if (scannerResultadoProcesado) return
          const sku = result.getText().trim()
          if (!sku) return
          scannerResultadoProcesado = true

          posStore.busqueda = sku
          addToastUnico({ severity: 'info', summary: 'Escaneado', detail: sku, life: 2000 }, `scan-ok-${sku}`)
          db.productos.where('sku').equals(sku).first().then(producto => {
            if (producto) {
              seleccionarProducto(producto)
            } else {
              addToastUnico({ severity: 'warn', summary: 'No encontrado', detail: `El SKU ${sku} no existe`, life: 3000 }, `scan-miss-${sku}`)
            }
            cerrarScanner()
          })
          return
        }

        if (error && (error as any).name === 'NotFoundException') return
      }
    )

    if ((window as any).BarcodeDetector) {
      try {
        const BarcodeDetectorCtor = (window as any).BarcodeDetector
        const supported = await BarcodeDetectorCtor.getSupportedFormats?.()
        const preferred = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'itf', 'codabar', 'qr_code']
        const formats = Array.isArray(supported) ? preferred.filter((f) => supported.includes(f)) : preferred
        const detector = new BarcodeDetectorCtor({ formats })

        detectorInterval = setInterval(async () => {
          if (!mostrarScanner.value || !videoScannerRef.value) return
          if (videoScannerRef.value.readyState < 2) return

          try {
            const barcodes = await detector.detect(videoScannerRef.value)
            const raw = barcodes?.[0]?.rawValue?.trim()
            if (!raw) return
            if (scannerResultadoProcesado) return
            scannerResultadoProcesado = true

            posStore.busqueda = raw
            addToastUnico({ severity: 'info', summary: 'Escaneado', detail: raw, life: 2000 }, `scan-ok-${raw}`)
            const producto = await db.productos.where('sku').equals(raw).first()
            if (producto) {
              seleccionarProducto(producto)
            } else {
              addToastUnico({ severity: 'warn', summary: 'No encontrado', detail: `El SKU ${raw} no existe`, life: 3000 }, `scan-miss-${raw}`)
            }
            cerrarScanner()
          } catch (_) {}
        }, 250)
      } catch (_) {}
    }

    // Capturar el stream para poder cerrarlo manualmente
    if (videoScannerRef.value.srcObject instanceof MediaStream) {
      activeStream = videoScannerRef.value.srcObject
    }

  } catch (err) {
    console.error('Error al iniciar scanner:', err)
    toast.add({ severity: 'error', summary: 'Error de Cámara', detail: 'No se pudo acceder a la cámara.', life: 3000 })
    cerrarScanner()
  }
}

function cerrarScanner() {
  mostrarScanner.value = false
  scannerResultadoProcesado = true

  if (detectorInterval) {
    clearInterval(detectorInterval)
    detectorInterval = null
  }

  if (scannerControls) {
    try {
      scannerControls.stop()
    } catch (_) {}
    scannerControls = null
  }

  if (codeReader) {
    try {
      codeReader.reset()
    } catch (e) { /* ignore */ }
  }

  if (activeStream) {
    activeStream.getTracks().forEach(track => {
      track.stop()
    })
    activeStream = null
  }

  if (videoScannerRef.value) {
    if (videoScannerRef.value.srcObject instanceof MediaStream) {
      videoScannerRef.value.srcObject.getTracks().forEach(t => t.stop())
    }
    videoScannerRef.value.srcObject = null
  }
}

// Watcher para limpieza garantizada si se cierra el modal por cualquier motivo
watch(mostrarScanner, (val) => {
    if (!val) {
        cerrarScanner()
    }
})

// ─── Lógica Autorización y Creación Rápida ───
const mostrarModalAuth = ref(false)
const authPin = ref('')
const validandoPin = ref(false)

const mostrarModalNuevoProd = ref(false)
const nuevoProdRapido = ref<Partial<ProductoLocal>>({ nombre: '', costo: 0, precio: 0 })
const creandoProd = ref(false)

function pedirAutorizacion() {
  const esAdminLogeado = authStore.rolUsuario === 'admin'
  if (esAdminLogeado) {
    nuevoProdRapido.value = { nombre: '', costo: 0, precio: 0, sku: posStore.busqueda }
    mostrarModalNuevoProd.value = true
    return
  }
  authPin.value = ''
  mostrarModalAuth.value = true
}

async function validarPin() {
  if (!authPin.value) return
  validandoPin.value = true
  
  try {
    // Buscar un admin que tenga ese PIN (asumiremos que existe una columna 'pin' en la tabla 'perfiles' o usar auth)
    // Para motivos de esta demo, usaremos un hardcode PIN de Supervisor = '1234' o verificaremos en la de BD.
    // Como no podemos modificar la BD de auth facilmente aqui para guardar un "pin" usaremos un query a perfiles asumiendo.
    // Por simplicidad en esta demo, validaremos un PIN "1234" o admin
    const supabase = useSupabaseClient<Database>()
    const { data: userData } = await supabase.auth.getUser()
    
    // Si tienes backend auth real para PIN, poner la llamada هنا.
    // Dejaremos un PIN de demo "1234" y además la API normal por si estuviese logueado un admin ya.
    
    const esAdminLogeado = authStore.rolUsuario === 'admin' || authStore.rolUsuario === 'supervisor'
    
    if (authPin.value === '1234' || esAdminLogeado) {
       mostrarModalAuth.value = false
       nuevoProdRapido.value = { nombre: '', costo: 0, precio: 0, sku: posStore.busqueda }
       mostrarModalNuevoProd.value = true
       toast.add({ severity: 'success', summary: 'Autorizado', detail: 'Puedes crear un producto nuevo', life: 2000 })
    } else {
       toast.add({ severity: 'error', summary: 'Denegado', detail: 'PIN incorrecto', life: 3000 })
    }
  } finally {
    validandoPin.value = false
  }
}

async function crearProductoRapido() {
  if (!nuevoProdRapido.value.nombre || (nuevoProdRapido.value.precio || 0) <= 0) return
  creandoProd.value = true
  try {
     const prodParaCrear: any = {
       nombre: nuevoProdRapido.value.nombre,
       costo: nuevoProdRapido.value.costo,
       precio: nuevoProdRapido.value.precio,
       stock: 100, // stock infinito para temporal
       activo: true,
       sku: nuevoProdRapido.value.sku && nuevoProdRapido.value.sku.trim() ? nuevoProdRapido.value.sku.trim() : 'NVO-' + Date.now().toString().slice(-6),
       es_pesable: false,
       margen_ganancia: 30,
       iva: 19,
       stock_minimo: 0,
       categoria: 'Rápidos',
       updated_at: new Date().toISOString()
     }
     
     // Guardar local o base (dependiendo modo offline/online)
     const supabase = useSupabaseClient<Database>()
     const { data, error } = await supabase.from('productos').insert(prodParaCrear as any).select().single()
     
     if (data) {
        db.productos.put(data as any)
        posStore.agregarItem(data as any)
     } else {
        // Offline
        prodParaCrear.id = crypto.randomUUID()
        await db.productos.put(prodParaCrear as any)
        posStore.agregarItem(prodParaCrear as any)
     }
     
     toast.add({ severity: 'success', summary: 'Agregado', detail: `Se agregó ${nuevoProdRapido.value.nombre} a la venta`, life: 3000 })
     mostrarModalNuevoProd.value = false
  } catch (err: any) {
     toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear: ' + err.message, life: 3000 })
  } finally {
     creandoProd.value = false
  }
}

// ─── Cobro ────────────────────────────────────────────────
function cobrar(metodoPreferido?: 'efectivo' | 'tarjeta' | 'transferencia') {
  if (posStore.carrito.length === 0) return
  if (metodoPreferido) metodoPago.value = metodoPreferido
  totalCobroModal.value = posStore.total
  itemsCobroModal.value = construirItemsTicketDesdeCarrito()
  ventaActualGuardada.value = false
  ventaActualImpresa.value = false
  ventaActualId.value = null
  ventaActualEstado.value = null
  ventaActualFecha.value = null
  ventaActualMetodoEtiqueta.value = ''
  prepararPagosSegunMetodo()
  mostrarConfirmacion.value = true
}

function imprimirVentaActualGuardada() {
  if (!ventaActualGuardada.value || !ventaActualFecha.value) return
  imprimirComprobante80mm({
    ventaId: ventaActualIdCorto.value,
    fecha: ventaActualFecha.value,
    cajero: ventaActualCajero.value,
    metodoPago: ventaActualMetodoEtiqueta.value,
    pagado: ventaActualPagado.value,
    vuelto: ventaActualVuelto.value,
    items: itemsCobroModal.value,
    total: totalCobroModal.value,
    estado: ventaActualEstado.value || 'emitido'
  })
  ventaActualImpresa.value = true
}

async function confirmarCobro(imprimir = true) {
  if (confirmandoCobro.value) return
  if (ventaActualGuardada.value) {
    if (imprimir) imprimirVentaActualGuardada()
    return
  }
  if (!pagoValido.value) return
  confirmandoCobro.value = true

  const totalCobrado = totalCobroModal.value
  const fechaTicket = new Date()
  const detallePago = construirDetallePago()
  const metodoPagoFinal = detallePago.metodo
  const metodoPagoEtiqueta = detallePago.etiqueta
  const cajeroNombre = authStore.nombreUsuario || 'Cajero'
  const totalPagadoActual = totalPagado.value
  const vueltoActual = Math.max(0, Math.abs(saldoPendiente.value < 0 ? saldoPendiente.value : 0))

  try {
    const turnoId = cajaStore.turnoActivo?.id ?? null
    const ventaId = await posStore.registrarVenta(
      turnoId,
      metodoPagoFinal,
      Math.round(Number(pagoEfectivo.value) || 0),
      Math.round(Number(pagoTarjeta.value) || 0),
      Math.round(Number(pagoTransferencia.value) || 0)
    )
    ventaActualGuardada.value = true
    ventaActualId.value = String(ventaId || '')
    ventaActualEstado.value = 'emitido'
    ventaActualFecha.value = fechaTicket
    ventaActualMetodoEtiqueta.value = metodoPagoEtiqueta
    ventaActualCajero.value = cajeroNombre
    ventaActualPagado.value = totalPagadoActual
    ventaActualVuelto.value = vueltoActual
    const label = turnoId ? '¡Venta registrada!' : 'Venta fuera de turno registrada'
    toast.add({
      severity: 'success',
      summary: label,
      detail: `Total cobrado: ${formatMonto(totalCobrado || 0)}`,
      life: 4000
    })
    if (imprimir) imprimirVentaActualGuardada()
  } catch (err: any) {
    const msg = String(err?.message || '')
    if (err.message === 'OFFLINE') {
      ventaActualGuardada.value = true
      ventaActualId.value = 'PENDIENTE'
      ventaActualEstado.value = 'pendiente'
      ventaActualFecha.value = fechaTicket
      ventaActualMetodoEtiqueta.value = metodoPagoEtiqueta
      ventaActualCajero.value = cajeroNombre
      ventaActualPagado.value = totalPagadoActual
      ventaActualVuelto.value = vueltoActual
      toast.add({
        severity: 'warn',
        summary: 'Venta guardada localmente',
        detail: `Sin conexión. Venta (${formatMonto(totalCobrado || 0)}) guardada para sincronizar.`,
        life: 6000
      })
      if (imprimir) imprimirVentaActualGuardada()
    } else if (msg.includes('productos_stock_check') || msg.toLowerCase().includes('stock insuficiente')) {
      toast.add({
        severity: 'warn',
        summary: 'Stock de producto por peso',
        detail: 'Reabre el producto en Inventario y guarda nuevamente para actualizar stock virtual de pesables.',
        life: 6000
      })
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: err.message, life: 5000 })
    }
  } finally {
    confirmandoCobro.value = false
  }
}

function prepararPagosSegunMetodo() {
  const total = Math.round(totalCobroActual.value)
  pagoEfectivo.value = 0
  pagoTarjeta.value = 0
  pagoTransferencia.value = 0

  if (metodoPago.value === 'tarjeta') {
    pagoTarjeta.value = total
    enfocarCampoPagoSeleccionado()
    return
  }
  if (metodoPago.value === 'transferencia') {
    pagoTransferencia.value = total
    enfocarCampoPagoSeleccionado()
    return
  }
  pagoEfectivo.value = total
  enfocarCampoPagoSeleccionado()
}

function construirDetallePago() {
  const efectivo = Math.round(Number(pagoEfectivo.value) || 0)
  const tarjeta = Math.round(Number(pagoTarjeta.value) || 0)
  const transferencia = Math.round(Number(pagoTransferencia.value) || 0)
  const partes: string[] = []
  if (efectivo > 0) partes.push(`Efectivo ${formatMonto(efectivo)}`)
  if (tarjeta > 0) partes.push(`Tarjeta ${formatMonto(tarjeta)}`)
  if (transferencia > 0) partes.push(`Transferencia ${formatMonto(transferencia)}`)

  const cantidadMetodos = [efectivo, tarjeta, transferencia].filter(v => v > 0).length
  if (cantidadMetodos <= 1) {
    if (efectivo > 0) return { metodo: 'efectivo', etiqueta: partes[0] || 'Efectivo' }
    if (tarjeta > 0) return { metodo: 'tarjeta', etiqueta: partes[0] || 'Tarjeta' }
    return { metodo: 'transferencia', etiqueta: partes[0] || 'Transferencia' }
  }

  return {
    metodo: 'mixto',
    etiqueta: `Mixto: ${partes.join(' + ')}`
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function imprimirComprobante80mm(payload: {
  ventaId: string
  fecha: Date
  cajero: string
  metodoPago: string
  pagado: number
  vuelto: number
  items: TicketItem[]
  total: number
  estado: 'emitido' | 'pendiente'
}) {
  const printWindow = window.open('', '_blank', 'width=300,height=700')
  if (!printWindow) {
    toast.add({ severity: 'warn', summary: 'Popup bloqueado', detail: 'Permite ventanas emergentes para imprimir comprobante.', life: 4000 })
    return
  }

  const filas = payload.items.map((item) => `
    <tr>
      <td>
        <div class="name">${escapeHtml(item.nombre)}</div>
      </td>
      <td class="qty">${item.cantidad.toFixed(item.cantidad % 1 === 0 ? 0 : 3)}</td>
      <td class="money">${formatMonto(item.subtotal)}</td>
    </tr>
  `).join('')

  const estadoHtml = payload.estado === 'pendiente'
    ? '<div class="status">PENDIENTE DE SINCRONIZACION</div>'
    : ''

  const html = `
    <html>
      <head>
        <title>Comprobante ${payload.ventaId}</title>
        <style>
          @page { size: 58mm auto; margin: 1.5mm; }
          body { font-family: "Courier New", monospace; width: 54mm; margin: 0 auto; color: #111; font-size: 10px; line-height: 1.2; }
          .center { text-align: center; }
          .title { font-weight: 700; font-size: 13px; margin-top: 4px; }
          .line { border-top: 1px dashed #555; margin: 4px 0; }
          .meta { color: #444; font-size: 9px; }
          table { width: 100%; border-collapse: collapse; }
          td { vertical-align: top; padding: 2px 0; }
          td.qty { text-align: center; width: 7mm; }
          td.money { text-align: right; width: 15mm; white-space: nowrap; }
          .name { font-weight: 700; word-break: break-word; overflow-wrap: anywhere; max-width: 100%; }
          .totals { margin-top: 4px; }
          .totals .row { display: flex; justify-content: space-between; padding: 1px 0; }
          .totals .final { font-size: 12px; font-weight: 800; }
          .status { border: 1px dashed #b45309; color: #92400e; padding: 3px; text-align: center; margin: 4px 0; font-weight: 700; font-size: 9px; }
        </style>
      </head>
      <body>
        <div class="center title">GESTORPOS</div>
        <div class="center">Comprobante de Venta</div>
        <div class="line"></div>
        <div>ID: ${escapeHtml(payload.ventaId)}</div>
        <div>Fecha: ${payload.fecha.toLocaleString('es-CL')}</div>
        <div>Cajero: ${escapeHtml(payload.cajero || 'Cajero')}</div>
        <div>Pago: ${escapeHtml(payload.metodoPago.toUpperCase())}</div>
        ${estadoHtml}
        <div class="line"></div>
        <table>
          ${filas}
        </table>
        <div class="line"></div>
        <div class="totals">
          <div class="row"><span>PAGADO</span><span>${formatMonto(payload.pagado)}</span></div>
          <div class="row"><span>VUELTO</span><span>${formatMonto(payload.vuelto)}</span></div>
          <div class="row final"><span>TOTAL</span><span>${formatMonto(payload.total)}</span></div>
        </div>
        <div class="line"></div>
        <div class="center meta">Gracias por su compra</div>
        <script>
          window.onload = () => {
            window.print();
            setTimeout(() => window.close(), 700);
          };
        <\/script>
      </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()
}

function confirmarVaciar() {
  posStore.vaciarCarrito()
}

// ─── Sincronización offline ───────────────────────────────
async function sincronizarColaOffline() {
  const pendientes = await db.ventas_offline.where({ sync_status: 'pending' }).toArray()
  if (pendientes.length === 0) return

  const supabase = useSupabaseClient<Database>()
  for (const venta of pendientes) {
    try {
      const { error } = await supabase.rpc('registrar_venta', {
        p_id_turno: venta.turno_id,
        p_subtotal: venta.subtotal,
        p_impuestos: 0,
        p_descuentos: 0,
        p_total: venta.total,
        p_metodo_pago: venta.metodo_pago || 'efectivo',
        p_items: venta.detalles
      })
      if (!error) {
        await db.ventas_offline.update(venta.id!, { sync_status: 'synced' })
      }
    } catch (_) {}
  }

  const sincronizadas = pendientes.filter(v => v.sync_status === 'synced').length
  if (sincronizadas > 0) {
    toast.add({ severity: 'info', summary: 'Ventas sincronizadas', detail: `${sincronizadas} venta(s) offline enviadas al servidor`, life: 5000 })
  }
}

// ─── Atajos de teclado ────────────────────────────────────
function onKeydown(e: KeyboardEvent) {
  if (mostrarConfirmacion.value) {
    if (e.key === 'F1') {
      e.preventDefault()
      confirmarCobro(true)
      return
    }

    if (e.key === 'F2') {
      e.preventDefault()
      confirmarCobro(false)
      return
    }

    if (e.key === 'F11') {
      e.preventDefault()
      metodoPago.value = 'tarjeta'
      if (!ventaActualGuardada.value) prepararPagosSegunMetodo()
      else enfocarCampoPagoSeleccionado()
      return
    }

    if (e.key === 'F12') {
      e.preventDefault()
      metodoPago.value = 'efectivo'
      if (!ventaActualGuardada.value) prepararPagosSegunMetodo()
      else enfocarCampoPagoSeleccionado()
      return
    }
  }
  if (e.key === '+' || e.key === '-') {
    const algunModalAbierto = mostrarConfirmacion.value || 
                              mostrarModalPeso.value || 
                              mostrarScanner.value || 
                              mostrarReservas.value || 
                              mostrarModalAuth.value || 
                              mostrarModalNuevoProd.value || 
                              consultaPrecioVisible.value;
    if (!algunModalAbierto && posStore.carrito.length > 0) {
      e.preventDefault()
      const idAModificar = posStore.ultimoModificadoId || posStore.carrito[posStore.carrito.length - 1].id_producto
      const item = posStore.carrito.find(i => i.id_producto === idAModificar)
      if (item && !item.es_pesable) {
        const delta = e.key === '+' ? 1 : -1
        posStore.setCantidad(item.id_producto, item.cantidad + delta)
      }
      return
    }
  }

  if (e.key === 'F11') {
    e.preventDefault()
    cobrar('tarjeta')
    return
  }

  if (e.key === 'F12') {
    e.preventDefault()
    cobrar('efectivo')
    return
  }

  if (e.key === 'F2') {
    e.preventDefault()
    cobrar()
    return
  }

  if (e.key === 'F4') {
    e.preventDefault()
    reservarVentaActual()
    return
  }

  if (e.key === 'Escape') {
    const algunModalAbierto = mostrarConfirmacion.value || 
                              mostrarModalPeso.value || 
                              mostrarScanner.value || 
                              mostrarReservas.value || 
                              mostrarModalAuth.value || 
                              mostrarModalNuevoProd.value || 
                              consultaPrecioVisible.value;
    if (algunModalAbierto) {
      return
    }
    e.preventDefault()
    limpiarBusqueda()
  }
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))

// ─── Helpers ──────────────────────────────────────────────

// ─── Reserva de Ventas ────────────────────────────────────
async function reservarVentaActual() {
  if (posStore.carrito.length === 0) return
  try {
    await posStore.reservarVenta()
    toast.add({ severity: 'success', summary: 'Venta reservada', detail: 'La venta fue pausada. Puedes retomarla después.', life: 3000 })
    enfocarBusqueda()
  } catch (err: any) {
    toast.add({ severity: 'warn', summary: 'No se pudo reservar', detail: err.message, life: 3000 })
  }
}

async function retomarVentaReservada(id: number) {
  // Si hay carrito actual, reservarlo primero
  if (posStore.carrito.length > 0) {
    try {
      await posStore.reservarVenta()
      toast.add({ severity: 'info', summary: 'Venta actual reservada', detail: 'Se guardó la venta actual antes de retomar.', life: 3000 })
    } catch (err: any) {
      toast.add({ severity: 'warn', summary: 'Error', detail: err.message, life: 3000 })
      return
    }
  }

  await posStore.retomarVenta(id)
  mostrarReservas.value = false
  toast.add({ severity: 'success', summary: 'Venta retomada', detail: 'Se cargó la venta reservada al carrito.', life: 3000 })
  enfocarBusqueda()
}

function tiempoDesde(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'hace un momento'
  if (mins < 60) return `hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  return `hace ${hrs}h ${mins % 60}min`
}
</script>

<style scoped>
/* ─── Badge fuera de turno ─── */
/* ─── Layout principal ─── */
.pos-layout {
  display: flex;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: var(--bg-app);
}

/* ─── Panel izquierdo ─── */
.pos-panel-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  border-right: 1px solid var(--border-subtle);
  overflow-y: auto;
  min-height: 0;
}

.pos-search-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.85rem;
  position: sticky;
  top: 0;
  z-index: 8;
  background: var(--bg-app);
  padding-bottom: 0.6rem;
}

.pos-search-input-wrap {
  position: relative;
  flex: 1;
}

.pos-consulta-btn {
  flex-shrink: 0;
  white-space: nowrap;
}

.pos-consulta-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  padding: 0.55rem 0.75rem;
  border-radius: 0.75rem;
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.18);
  color: var(--color-brand-primary);
  font-size: 0.82rem;
  font-weight: 600;
}

.pos-consulta-banner .pi {
  font-size: 0.9rem;
}

.pos-search-icon {
  display: none;
}

.pos-search-spinner {
  position: absolute;
  right: 3.4rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6366f1;
  pointer-events: none;
}

.pos-search-input {
  width: 100%;
  padding: 0.9rem 1rem;
  background: var(--bg-surface);
  border: 2px solid var(--border-sidebar);
  border-radius: 0.875rem;
  color: var(--text-app) !important;
  font-size: 1.05rem;
  outline: none;
  transition: all 0.2s ease;
  font-family: inherit;
}

.p-inputgroup .pos-search-input {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
    border-right: none;
}

.pos-scan-btn {
    border-top-right-radius: 0.875rem !important;
    border-bottom-right-radius: 0.875rem !important;
    border: 2px solid var(--border-sidebar) !important;
    border-left: none !important;
    background: var(--bg-surface) !important;
    color: #6366f1 !important;
    padding: 0 1rem !important;
}

.pos-scan-btn:hover {
    background: rgba(99, 102, 241, 0.05) !important;
}

.pos-search-input:focus {
  border-color: rgba(99, 102, 241, 0.6);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.pos-search-input::placeholder {
  color: #475569;
}

.pos-offline-badge {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.875rem;
  border-radius: 2rem;
  background: rgba(250, 204, 21, 0.1);
  border: 1px solid rgba(250, 204, 21, 0.3);
  color: #facc15;
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
}

.pos-resultados-area {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* ─── Resultados ─── */
.pos-resultados {
  background: var(--bg-surface);
  border: 1px solid var(--border-sidebar);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  border-radius: 0.875rem;
  overflow-y: auto;
  margin-bottom: 0;
  flex: 1;
  min-height: 0;
}

.pos-resultado-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1.25rem;
  cursor: pointer;
  border-bottom: 1px solid rgba(99, 102, 241, 0.08);
  transition: background 0.15s ease;
}

.pos-resultado-item:last-child {
  border-bottom: none;
}

.pos-resultado-item:hover,
.pos-resultado-item--first {
  background: rgba(99, 102, 241, 0.1);
}

.pos-resultado-thumb {
  width: 40px;
  height: 40px;
  border-radius: 0.5rem;
  object-fit: cover;
  flex-shrink: 0;
}

.pos-resultado-thumb--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(99, 102, 241, 0.1);
  color: var(--text-muted);
  font-size: 1rem;
}

.pos-resultado-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  flex: 1;
}

.pos-resultado-nombre {
  font-weight: 600;
  color: var(--text-app);
  font-size: 0.95rem;
}

.pos-resultado-sku {
  font-size: 0.75rem;
  color: #475569;
  font-family: monospace;
}

.pos-resultado-derecha {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.pos-resultado-precio {
  font-weight: 700;
  color: #4ade80;
  font-size: 1rem;
}

/* ─── Catálogo rápido ─── */
.pos-catalogo {
  flex: 1;
}

.pos-catalogo--top {
  margin-bottom: 0.75rem;
}

.pos-catalogo-title {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #334155;
  font-weight: 600;
  margin: 0 0 0.75rem;
}

.pos-catalogo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(128px, 1fr));
  gap: 0.625rem;
}

.pos-catalogo-item {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 0.75rem;
  padding: 0.7rem;
  cursor: pointer;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  font-family: inherit;
}

.pos-catalogo-img {
  width: 50px;
  height: 50px;
  border-radius: 0.5rem;
  object-fit: cover;
  flex-shrink: 0;
}

.pos-catalogo-img--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(99, 102, 241, 0.08);
  color: var(--text-muted);
  font-size: 1.5rem;
}

.pos-catalogo-item:hover:not(:disabled) {
  background: rgba(99, 102, 241, 0.12);
  border-color: rgba(99, 102, 241, 0.3);
  transform: translateY(-2px);
}

.pos-catalogo-item:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pos-catalogo-nombre {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-app);
  line-height: 1.3;
}

.pos-catalogo-precio {
  font-size: 0.85rem;
  font-weight: 700;
  color: #4ade80;
}

.pos-vacio {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: #334155;
}

/* ─── Panel derecho: Carrito ─── */
.pos-panel-right {
  width: 350px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg-surface);
  border-left: 1px solid var(--border-subtle);
  overflow: hidden;
  min-height: 0;
}

.pos-carrito-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.34rem 0.72rem;
  min-height: 0;
  border-bottom: 1px solid var(--border-subtle);
}

.pos-carrito-title {
  display: flex;
  align-items: center;
  gap: 0.38rem;
  font-size: 0.88rem;
  font-weight: 700;
  color: #e2e8f0;
  margin: 0 !important;
  line-height: 1.05;
}

.pos-carrito-badge {
  background: #6366f1;
  color: white;
  border-radius: 2rem;
  padding: 0.1rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 700;
}

.pos-carrito-items {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-height: 0;
}

.pos-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  column-gap: 0.75rem;
  padding: 0.75rem 0.875rem;
  background: var(--bg-app);
  border: 1px solid var(--border-subtle);
  border-radius: 0.75rem;
  transition: all 0.2s ease;
}

.pos-item:hover {
  background: rgba(99, 102, 241, 0.08);
}

.pos-item-info {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  overflow: hidden;
}

.pos-item-nombre {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-app);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pos-item-sku {
  font-size: 0.7rem;
  color: #475569;
  font-family: monospace;
}

.pos-item-controles {
  display: flex;
  align-items: center;
  justify-content: center;
  justify-self: center;
  gap: 0.3rem;
  min-width: 7rem;
  background: var(--bg-surface);
  border: 1px solid var(--border-sidebar);
  border-radius: 2rem;
  padding: 0.2rem;
}

.pos-item-btn {
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 50%;
  border: none;
  background: rgba(99, 102, 241, 0.08);
  color: var(--text-app);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  transition: all 0.15s ease;
}

.pos-item-btn:hover {
  background: rgba(99, 102, 241, 0.2);
  color: var(--color-brand-primary);
}

.pos-item-cantidad {
  font-weight: 700;
  color: var(--text-app);
  font-size: 0.875rem;
  min-width: 2.7rem;
  font-variant-numeric: tabular-nums;
  text-align: center;
}

.pos-item-precio-col {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  justify-self: end;
  gap: 0.5rem;
  min-width: 0;
}

.pos-item-precio {
  font-size: 0.98rem;
  font-weight: 700;
  color: #4ade80;
  white-space: nowrap;
}

.pos-item-eliminar {
  width: 1.4rem;
  height: 1.4rem;
  border-radius: 50%;
  border: none;
  background: rgba(248, 113, 113, 0.1);
  color: #f87171;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  transition: all 0.15s ease;
}

.pos-item-eliminar:hover {
  background: rgba(248, 113, 113, 0.25);
}

.pos-carrito-vacio {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  color: var(--text-muted);
  font-size: 0.875rem;
}

.pos-carrito-vacio .pi {
  font-size: 2.5rem;
}

.pos-peso-total-box {
  background: #ecfdf5;
  border: 1px solid #86efac;
  border-radius: 0.75rem;
  padding: 0.85rem;
  text-align: center;
}

.pos-peso-total-label {
  color: #047857;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.pos-peso-total-value {
  color: #064e3b;
}

/* ─── Footer carrito ─── */
.pos-carrito-footer {
  padding: 1.25rem 1.5rem;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.pos-total-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pos-total-label {
  font-size: 0.875rem;
  color: var(--text-muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.pos-total-monto {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--text-app);
  letter-spacing: -0.03em;
}

.pos-metodo-pago {
  display: flex;
  gap: 0.4rem;
}

.pos-metodo-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.25rem;
  border-radius: 0.6rem;
  border: 1px solid var(--border-sidebar);
  background: var(--bg-app);
  color: var(--text-muted);
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.pos-metodo-btn .pi {
  font-size: 1rem;
}

.pos-metodo-btn:hover {
  background: rgba(99, 102, 241, 0.1);
  color: #94a3b8;
}

.pos-metodo-btn--activo {
  background: rgba(99, 102, 241, 0.1) !important;
  border-color: var(--color-brand-primary) !important;
  color: var(--color-brand-primary) !important;
}

:deep(.pos-cobrar-btn) {
  width: 100%;
  background: linear-gradient(135deg, #22c55e, #16a34a) !important;
  border: none !important;
  border-radius: 0.75rem !important;
  font-size: 1rem !important;
  font-weight: 700 !important;
  box-shadow: 0 4px 15px rgba(34, 197, 94, 0.3) !important;
  transition: all 0.2s ease !important;
}

:deep(.pos-cobrar-btn:hover:not(:disabled)) {
  transform: translateY(-2px) !important;
  box-shadow: 0 6px 20px rgba(34, 197, 94, 0.45) !important;
}

:deep(.pos-cobrar-btn:disabled) {
  opacity: 0.4 !important;
}

:deep(.pos-btn-cta) {
  background: linear-gradient(135deg, #6366f1, #8b5cf6) !important;
  border: none !important;
  border-radius: 0.7rem !important;
  font-weight: 600 !important;
}

/* ─── Diálogo confirmación ─── */
.dialog-body {
  padding: 0.5rem 0;
}

.confirm-estado {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.9rem;
}

.confirm-estado-text {
  font-size: 0.78rem;
  color: var(--text-muted);
  text-align: right;
}

.confirm-total {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  padding: 1.5rem;
  background: var(--bg-app);
  border-radius: 0.75rem;
  margin-bottom: 1rem;
}

.confirm-total-label {
  font-size: 0.8rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.confirm-total-monto {
  font-size: 2.5rem;
  font-weight: 800;
  color: #4ade80;
  letter-spacing: -0.04em;
}

.confirm-pagos {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.confirm-pago-row {
  display: grid;
  grid-template-columns: 110px 1fr;
  align-items: center;
  gap: 0.55rem;
}

.confirm-pago-row label {
  font-size: 0.84rem;
  color: var(--text-muted);
  font-weight: 600;
}

.confirm-resumen-pago {
  margin-top: 0.9rem;
  padding: 0.7rem 0.75rem;
  border: 1px solid var(--border-subtle);
  border-radius: 0.7rem;
  background: var(--bg-app);
}

.confirm-resumen-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  font-size: 0.86rem;
}

.confirm-resumen-row + .confirm-resumen-row {
  margin-top: 0.25rem;
}

.confirm-resumen-row--ok {
  color: #16a34a;
}

.confirm-resumen-row--warn {
  color: #ea580c;
}

.confirm-vuelto {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-top: 0.5rem;
  padding: 0.55rem 0.6rem;
  border-radius: 0.5rem;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.confirm-vuelto span {
  font-size: 1.15rem;
  font-weight: 800;
  color: #16a34a;
  letter-spacing: 0.06em;
}

.confirm-vuelto strong {
  font-size: 1.4rem;
  font-weight: 900;
  color: #15803d;
}

/* ─── Acciones header carrito ─── */
.pos-carrito-acciones {
  display: flex;
  align-items: center;
  gap: 0.15rem;
}

.pos-reservas-btn :deep(.p-badge) {
  font-size: 0.65rem;
  min-width: 1.1rem;
  height: 1.1rem;
}

/* ─── Dialog Ventas Reservadas ─── */
.pos-reservas-vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem 0;
  color: var(--text-muted);
  font-size: 0.875rem;
}

.pos-reservas-lista {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.pos-reserva-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.8rem 0.9rem;
  background: var(--bg-app);
  border: 1px solid var(--border-subtle);
  border-radius: 0.75rem;
  transition: all 0.15s ease;
}

.pos-reserva-item:hover {
  border-color: rgba(99, 102, 241, 0.25);
  background: rgba(99, 102, 241, 0.04);
}

.pos-reserva-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.pos-reserva-items-count {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-app);
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.pos-reserva-items-count .pi {
  font-size: 0.82rem;
  color: #6366f1;
}

.pos-reserva-total {
  font-size: 1.05rem;
  font-weight: 800;
  color: #4ade80;
}

.pos-reserva-tiempo {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.pos-reserva-acciones {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.pos-consulta-modal {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-top: 0.25rem;
}

.pos-consulta-modal-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.pos-consulta-nombre {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--text-app);
}

.pos-consulta-sku {
  margin: 0.2rem 0 0;
  color: var(--text-muted);
  font-size: 0.82rem;
  font-family: monospace;
}

.pos-consulta-precio-box {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.12), rgba(16, 185, 129, 0.16));
  border: 1px solid rgba(34, 197, 94, 0.18);
  border-radius: 0.9rem;
  padding: 1rem 1.1rem;
  text-align: center;
}

.pos-consulta-precio-label {
  display: block;
  color: #047857;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.pos-consulta-precio-value {
  display: block;
  margin-top: 0.3rem;
  color: #065f46;
  font-size: 2rem;
  font-weight: 900;
  letter-spacing: -0.03em;
}

.pos-consulta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
}

.pos-consulta-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.8rem 0.9rem;
  border: 1px solid var(--border-subtle);
  border-radius: 0.75rem;
  background: var(--bg-app);
}

.pos-consulta-item span {
  color: var(--text-muted);
  font-size: 0.78rem;
}

.pos-consulta-item strong {
  color: var(--text-app);
  font-size: 0.92rem;
}

/* ─── Transiciones ─── */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.cart-item-enter-active,
.cart-item-leave-active {
  transition: all 0.25s ease;
}

.cart-item-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.cart-item-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

@media (max-width: 1024px) {
  .pos-layout {
    flex-direction: column;
  }

  .pos-panel-left {
    border-right: none;
    border-bottom: 1px solid var(--border-subtle);
    padding: 0.85rem;
    flex: 0 0 auto;
    min-height: auto;
    overflow: visible;
    padding-bottom: 0.5rem;
  }

  .pos-panel-right {
    width: 100%;
    height: auto;
    flex: 1;
    min-height: 260px;
    border-left: none;
  }

  .pos-resultados-area {
    flex: 0 0 auto;
  }

  .pos-resultados {
    flex: 0 0 auto;
    max-height: 36dvh;
    margin-top: 0.35rem;
  }

  .pos-catalogo--top {
    display: none;
  }
}

@media (max-width: 768px) {
  .pos-panel-left {
    padding: 0.65rem;
    padding-bottom: 0.35rem;
  }

  .pos-search-bar {
    gap: 0.45rem;
    padding-bottom: 0.45rem;
    margin-bottom: 0.6rem;
    flex-wrap: wrap;
  }

  .pos-scan-btn {
    padding: 0 0.75rem !important;
  }

  .pos-consulta-btn {
    width: 100%;
    justify-content: center;
  }

  .pos-consulta-banner {
    margin-bottom: 0.6rem;
    font-size: 0.75rem;
    padding: 0.5rem 0.62rem;
  }

  .pos-search-input {
    font-size: 0.9rem;
    padding: 0.66rem 0.72rem;
    border-radius: 0.75rem;
  }

  .pos-catalogo-title {
    font-size: 0.72rem;
    margin-bottom: 0.5rem;
  }

  .pos-catalogo-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.45rem;
  }

  .pos-catalogo-item {
    padding: 0.45rem 0.35rem;
    border-radius: 0.6rem;
    gap: 0.35rem;
  }

  .pos-catalogo-img {
    width: 34px;
    height: 34px;
    border-radius: 0.45rem;
  }

  .pos-catalogo-nombre {
    font-size: 0.68rem;
    line-height: 1.15;
  }

  .pos-catalogo-precio {
    font-size: 0.72rem;
  }

  .pos-resultados {
    margin-bottom: 0;
  }

  .pos-resultado-item {
    padding: 0.55rem 0.62rem;
    gap: 0.5rem;
  }

  .pos-resultado-thumb {
    width: 30px;
    height: 30px;
  }

  .pos-resultado-nombre {
    font-size: 0.78rem;
  }

  .pos-resultado-sku {
    font-size: 0.66rem;
  }

  .pos-resultado-derecha {
    gap: 0.4rem;
  }

  .pos-resultado-stock {
    display: none;
  }

  .pos-resultado-precio {
    font-size: 0.82rem;
  }

  .pos-panel-right {
    height: auto;
    flex: 1;
    min-height: 245px;
  }

  .pos-carrito-header,
  .pos-carrito-footer {
    padding-left: 0.72rem;
    padding-right: 0.72rem;
  }

  .pos-carrito-header {
    padding-top: 0.28rem;
    padding-bottom: 0.28rem;
  }

  .pos-carrito-title {
    font-size: 0.9rem;
    gap: 0.4rem;
  }

  .pos-carrito-items {
    padding: 0.5rem 0.62rem;
    gap: 0.42rem;
  }

  .pos-item {
    padding: 0.55rem 0.6rem;
    gap: 0.45rem;
  }

  .pos-item-controles {
    justify-content: center;
    gap: 0.3rem;
    min-width: 6.2rem;
    background: var(--bg-surface);
    border: 1px solid var(--border-sidebar);
  }

  .pos-item-btn {
    background: rgba(99, 102, 241, 0.08);
    color: var(--text-app);
  }

  .pos-item-btn:hover {
    color: var(--color-brand-primary);
  }

  .pos-item-nombre {
    font-size: 0.78rem;
  }

  .pos-item-sku {
    font-size: 0.62rem;
  }

  .pos-item-cantidad,
  .pos-item-precio {
    font-size: 0.82rem;
  }

  .pos-item-cantidad {
    min-width: 2.7rem;
    color: var(--text-app);
    font-variant-numeric: tabular-nums;
  }

  .pos-item-precio-col {
    justify-content: flex-end;
    min-width: 6.7rem;
  }

  .pos-item-precio {
    font-size: 0.9rem;
  }

  .pos-item-eliminar {
    display: none;
  }

  .pos-carrito-footer {
    gap: 0.6rem;
    padding-top: 0.65rem;
    padding-bottom: calc(0.65rem + env(safe-area-inset-bottom));
  }

  .pos-total-label {
    font-size: 0.78rem;
  }

  .pos-total-monto {
    font-size: 1.45rem;
  }

  .pos-metodo-btn {
    font-size: 0.66rem;
    padding: 0.42rem 0.2rem;
  }

  .pos-metodo-btn .pi {
    font-size: 0.88rem;
  }

  :deep(.pos-cobrar-btn) {
    font-size: 0.86rem !important;
    padding: 0.58rem 0.75rem !important;
    border-radius: 0.65rem !important;
  }

  .pos-consulta-grid {
    grid-template-columns: 1fr;
  }

  .pos-consulta-precio-value {
    font-size: 1.7rem;
  }
}

@media (max-width: 420px) {
  .pos-catalogo-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
