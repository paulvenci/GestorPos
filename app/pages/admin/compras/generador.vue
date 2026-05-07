<template>
  <div class="admin-page max-w-7xl mx-auto px-4">
    <div class="flex justify-between items-center mb-6">
      <div class="flex items-center gap-3">
        <Button icon="pi pi-arrow-left" text rounded severity="secondary" @click="router.push('/admin/compras')" />
        <div>
          <h1 class="text-2xl font-bold flex items-center gap-2 text-color">
            <i class="pi pi-sparkles text-indigo-500"></i> Generador de Pedidos
          </h1>
          <p class="text-color-secondary text-sm mt-1">Haz tu lista de faltantes y el sistema la dividirá por proveedor.</p>
        </div>
      </div>
      <Button 
        label="Procesar y Crear Pedidos" 
        icon="pi pi-check" 
        :disabled="listaFaltantes.length === 0" 
        :loading="procesando"
        @click="procesarLista" 
      />
    </div>

    <!-- Layout vertical: búsqueda arriba, lista abajo -->

    <!-- Buscador (arriba) -->
    <div class="surface-card p-4 rounded-xl border surface-border mb-4">
      <div class="flex items-center gap-3">
        <span class="p-input-icon-left flex-1">
          <i class="pi pi-search" />
          <InputText
            v-model="busqueda"
            placeholder="Buscar producto por nombre o código..."
            class="w-full"
            @input="buscarProducto"
            autofocus
          />
        </span>
      </div>

      <!-- Resultados de búsqueda -->
      <div v-if="resultados.length > 0" class="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
        <div
          v-for="prod in resultados"
          :key="prod.id"
          class="p-3 border surface-border rounded-lg cursor-pointer hover:surface-hover transition-colors"
          @click="agregarALista(prod)"
        >
          <p class="font-bold text-sm truncate">{{ prod.nombre }}</p>
          <div class="flex justify-between text-xs text-color-secondary mt-1">
            <span>Stock: <strong :class="prod.stock <= (prod.stock_minimo||0) ? 'text-red-500' : ''">{{ prod.stock }}</strong></span>
            <span>{{ formatMonto(prod.costo || 0) }}</span>
          </div>
        </div>
      </div>
      <p v-else-if="busqueda.length > 1" class="text-color-secondary text-sm mt-3 text-center">No se encontraron productos.</p>
    </div>

    <!-- Lista actual (abajo) -->
    <div class="surface-card rounded-xl border surface-border flex flex-col" style="min-height: 400px">
      <div class="flex justify-between items-center border-b surface-border p-4">
        <h2 class="font-bold text-lg flex items-center gap-2">
          <i class="pi pi-list"></i> Tu Lista Actual
        </h2>
        <Tag :value="listaFaltantes.length + ' ítems'" severity="info" rounded />
      </div>

      <div v-if="listaFaltantes.length === 0" class="flex-1 flex flex-col items-center justify-center text-color-secondary opacity-50 p-10">
        <i class="pi pi-cart-plus text-6xl mb-4"></i>
        <p>Busca productos arriba y agrégalos a tu lista.</p>
      </div>

      <div v-else class="divide-y surface-border">
        <div
          v-for="(item, index) in listaFaltantes"
          :key="item.producto.id"
          class="flex items-center justify-between px-4 py-3"
        >
          <!-- Info producto -->
          <div class="flex-1 min-w-0 pr-4">
            <p class="font-bold text-sm truncate">{{ item.producto.nombre }}</p>
            <div class="flex gap-3 text-xs text-color-secondary mt-0.5">
              <span>Stock: {{ item.producto.stock }}</span>
              <span v-if="item.proveedorSugerido" class="flex items-center gap-1">
                <i class="pi pi-building text-[10px]"></i> {{ item.proveedorSugerido }}
              </span>
              <span v-else class="italic">Proveedor por determinar</span>
            </div>
          </div>

          <!-- Control cantidad + acciones -->
          <div class="flex items-center gap-3 flex-shrink-0">
            <div class="flex flex-col items-center">
              <label class="text-[10px] text-color-secondary uppercase font-bold mb-1">A Pedir</label>
              <div class="flex items-center rounded-lg overflow-hidden border surface-border">
                <button
                  class="w-8 h-8 flex items-center justify-center surface-hover text-color hover:text-primary transition-colors"
                  @click="item.cantidad = Math.max(1, item.cantidad - 1)"
                >
                  <i class="pi pi-minus text-xs"></i>
                </button>
                <input
                  type="number"
                  v-model="item.cantidad"
                  class="w-12 h-8 text-center bg-transparent border-none text-sm font-bold focus:ring-0 outline-none p-0 text-color"
                  min="1"
                />
                <button
                  class="w-8 h-8 flex items-center justify-center surface-hover text-color hover:text-primary transition-colors"
                  @click="item.cantidad++"
                >
                  <i class="pi pi-plus text-xs"></i>
                </button>
              </div>
            </div>
            <Button icon="pi pi-trash" text rounded severity="danger" @click="listaFaltantes.splice(index, 1)" />
          </div>
        </div>
      </div>

      <!-- Totales -->
      <div class="border-t surface-border p-4 mt-auto flex justify-between items-center">
        <span class="text-color-secondary font-medium">Inversión Estimada:</span>
        <span class="font-black text-xl text-indigo-600 dark:text-indigo-400">{{ formatMonto(inversionEstimada) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useComprasStore } from '~/stores/compras'
import { useProductosStore } from '~/stores/productos'
import type { ProductoLocal } from '~/db'
import { useToast } from 'primevue/usetoast'

const router = useRouter()
const toast = useToast()
const comprasStore = useComprasStore()
const productosStore = useProductosStore()

const busqueda = ref('')
const resultados = ref<ProductoLocal[]>([])
const listaFaltantes = ref<{ producto: ProductoLocal, cantidad: number, proveedorSugerido: string | null }[]>([])
const procesando = ref(false)

const formatMonto = (valor: number) => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(valor)
}

const inversionEstimada = computed(() => {
  return listaFaltantes.value.reduce((sum, item) => sum + (item.cantidad * (item.producto.costo || 0)), 0)
})

function buscarProducto() {
  if (busqueda.value.length < 2) {
    resultados.value = []
    return
  }
  const query = busqueda.value.toLowerCase()
  resultados.value = productosStore.productos.filter(p => 
    p.nombre.toLowerCase().includes(query) || 
    (p.sku && p.sku.toLowerCase().includes(query))
  ).slice(0, 10) // Mostrar máximo 10
}

async function agregarALista(prod: ProductoLocal) {
  const existe = listaFaltantes.value.find(i => i.producto.id === prod.id)
  if (existe) {
    existe.cantidad++
  } else {
    let cantidadSugerida = 1
    if (prod.stock_minimo && prod.stock < prod.stock_minimo) {
       cantidadSugerida = (prod.stock_minimo * 2) - prod.stock
       if (cantidadSugerida < 1) cantidadSugerida = 1
    }

    // Buscar proveedor sugerido del historial
    const { data: historial } = await useSupabaseClient()
      .from('detalle_pedidos')
      .select('pedidos_compra!inner(proveedor_id, proveedores(nombre))')
      .eq('producto_id', prod.id)
      .order('created_at', { ascending: false })
      .limit(1)

    const proveedorSugerido = (historial?.[0] as any)?.pedidos_compra?.proveedores?.nombre || null

    listaFaltantes.value.unshift({
      producto: prod,
      cantidad: cantidadSugerida,
      proveedorSugerido
    })
  }
  busqueda.value = ''
  resultados.value = []
}

async function procesarLista() {
  if (listaFaltantes.value.length === 0) return
  
  procesando.value = true
  try {
    await comprasStore.generarPedidosAgrupados(listaFaltantes.value)
    toast.add({ severity: 'success', summary: '¡Éxito!', detail: 'Los pedidos han sido generados y agrupados por proveedor.', life: 4000 })
    router.push('/admin/compras')
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Ocurrió un problema al generar los pedidos.', life: 4000 })
  } finally {
    procesando.value = false
  }
}
</script>
