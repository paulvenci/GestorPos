<template>
  <div class="ayuda-container">
    <div class="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
      <div>
        <h1 class="text-3xl font-bold flex items-center gap-3" style="color: var(--text-app)">
          <i class="pi pi-question-circle text-indigo-500"></i> Centro de Ayuda
        </h1>
        <p class="mt-2 text-sm max-w-2xl font-bold" style="color: var(--text-app)">
          Encuentra guías visuales y pasos detallados para realizar tus operaciones diarias en GestorPOS. Haz clic en las imágenes para ver la galería a pantalla completa.
        </p>
      </div>
    </div>

    <!-- Pestañas de categorías -->
    <Tabs value="0" class="ayuda-tabs">
      <TabList>
        <Tab value="0">
          <div class="flex items-center gap-2">
            <i class="pi pi-shopping-cart"></i>
            <span>Punto de Venta</span>
          </div>
        </Tab>
        <Tab value="1">
          <div class="flex items-center gap-2">
            <i class="pi pi-wallet"></i>
            <span>Caja y Turnos</span>
          </div>
        </Tab>
        <Tab value="2">
          <div class="flex items-center gap-2">
            <i class="pi pi-box"></i>
            <span>Inventario y Reportes</span>
          </div>
        </Tab>
      </TabList>

      <TabPanels class="pt-6 px-0 pb-0">
        <!-- Pestaña 1: Punto de Venta -->
        <TabPanel value="0">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <Card class="ayuda-card group">
              <template #header>
                <!-- Carousel Interactive -->
                <div class="relative overflow-hidden bg-slate-100 dark:bg-slate-900">
                  <div 
                    ref="ventaSimpleGallery"
                    class="flex overflow-x-auto gap-0 snap-x snap-mandatory card-gallery hidden-scrollbar"
                    @scroll="onScrollGallery"
                  >
                    <div v-for="(img, idx) in imagenesVentaSimple" :key="idx" class="snap-center shrink-0 w-full h-48 flex items-center justify-center p-2 cursor-pointer" @click="abrirImagenEnModal(idx)">
                       <Image :src="img.src" :alt="img.alt" class="w-full h-full object-contain rounded shadow-sm border border-slate-200 dark:border-slate-800 pointer-events-none" image-class="w-full h-full object-contain" />
                    </div>
                  </div>

                  <!-- Controles con contorno -->
                  <div class="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button icon="pi pi-chevron-left" rounded severity="secondary" @click.stop="scrollGallery('prev')" class="pointer-events-auto bg-white/90 dark:bg-black/60 backdrop-blur-sm border border-black/10 dark:border-white/10 shadow-md h-10 w-10" />
                  </div>
                  <div class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button icon="pi pi-chevron-right" rounded severity="secondary" @click.stop="scrollGallery('next')" class="pointer-events-auto bg-white/90 dark:bg-black/60 backdrop-blur-sm border border-black/10 dark:border-white/10 shadow-md h-10 w-10" />
                  </div>

                  <!-- Indicadores -->
                  <div class="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 px-2 py-1 rounded-full bg-black/20 backdrop-blur-sm">
                    <div 
                      v-for="(_, i) in imagenesVentaSimple" 
                      :key="i"
                      class="w-1.5 h-1.5 rounded-full transition-all duration-300"
                      :class="currentIdx === i ? 'bg-indigo-400 w-4' : 'bg-white/60'"
                    />
                  </div>

                  <!-- Contador de Pasos -->
                  <div class="absolute top-3 right-3 bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                    PASO {{ currentIdx + 1 }} / {{ imagenesVentaSimple.length }}
                  </div>
                </div>
              </template>
              <template #title>Realizar una Venta Simple</template>
              <template #content>
                <ol class="list-decimal pl-5 space-y-2 text-sm font-bold" style="color: var(--text-app)">
                  <li>Busca un producto por su Nombre o Código de Barras (SKU) en el buscador superior.</li>
                  <li>Presiona <strong class="text-indigo-600 dark:text-indigo-400">Enter</strong> o usa el lector láser. El producto se agregará a la canasta.</li>
                  <li>Al terminar, pulsa el botón <strong class="text-indigo-600 dark:text-indigo-400">Cobrar (F12) (Efectivo)</strong>.</li>
                  <li>Selecciona el medio de pago, ingresa el dinero recibido y confirma el pago.</li>
                
                </ol>
              </template>
            </Card>

            <Card class="ayuda-card">
              <template #header>
                <Image src="/Punto de Venta/Ayuda/Consultar Precio/Consultar Precio 1.png" alt="Consultar Precio" preview class="w-full object-cover h-48 card-img" />
              </template>
              <template #title>Consultar Precio (F3)</template>
              <template #content>
                <ol class="list-decimal pl-5 space-y-2 text-sm font-bold" style="color: var(--text-app)">
                  <li>Presiona la tecla <strong class="text-indigo-600 dark:text-indigo-400">F3</strong> en cualquier momento dentro de la pantalla del POS.</li>
                  <li>Escanéa el código de barras del producto.</li>
                  <li>Se abrirá una ventana mostrando el nombre, stock actual y el precio al cliente.</li>
                </ol>
              </template>
            </Card>

            <Card class="ayuda-card">
              <template #header>
                <Image src="https://fakeimg.pl/600x400/282828/fff/?text=Venta+a+Crédito+(Fiado)" alt="Fiado" preview class="w-full object-cover h-48 card-img" />
              </template>
              <template #title>Venta a Crédito (Fiado)</template>
              <template #content>
                <ol class="list-decimal pl-5 space-y-2 text-sm font-bold" style="color: var(--text-app)">
                  <li>Agrega los productos que el cliente llevará.</li>
                  <li>Presiona <strong class="text-indigo-600 dark:text-indigo-400">Cobrar (F12)</strong>.</li>
                  <li>Marca la casilla <strong>"Venta a Crédito (Fiado)"</strong>.</li>
                  <li>Busca y selecciona a un cliente registrado (o crea uno rápido).</li>
                  <li>Presiona Registrar para que la deuda se le asigne.</li>
                </ol>
              </template>
            </Card>
          </div>
        </TabPanel>

        <!-- Pestaña 2: Caja y Turnos -->
        <TabPanel value="1">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <Card class="ayuda-card">
              <template #header>
                <Image src="https://fakeimg.pl/600x400/282828/fff/?text=Apertura+de+Caja" alt="Apertura de Caja" preview class="w-full object-cover h-48 card-img" />
              </template>
              <template #title>Abrir Turno</template>
              <template #content>
                <ol class="list-decimal pl-5 space-y-2 text-sm font-bold" style="color: var(--text-app)">
                  <li>Dirígete al apartado <strong class="text-indigo-600 dark:text-indigo-400">Caja</strong> en el menú lateral.</li>
                  <li>Si no hay un turno activo, el sistema te pedirá el monto del <strong>Fondo Inicial</strong> (sencillo en gaveta).</li>
                  <li>Al ingresar el monto y confirmar, comenzará a registrarse todo bajo tu usuario.</li>
                </ol>
              </template>
            </Card>

            <Card class="ayuda-card">
              <template #header>
                <Image src="https://fakeimg.pl/600x400/282828/fff/?text=Gatos+y+Retiros" alt="Gastos e Ingresos" preview class="w-full object-cover h-48 card-img" />
              </template>
              <template #title>Gastos y Entradas de Dinero</template>
              <template #content>
                <ol class="list-decimal pl-5 space-y-2 text-sm font-bold" style="color: var(--text-app)">
                  <li>En la pestaña <strong>Caja</strong>, busca los botones de <strong>Ingresar Dinero</strong> o <strong>Retirar Dinero</strong>.</li>
                  <li>Especifica el monto y detalla un motivo (Ej: Pago de proveedores, Retiro a caja fuerte).</li>
                  <li>Esta acción imprimirá automáticamente un comprobante de movimiento.</li>
                </ol>
              </template>
            </Card>

            <Card class="ayuda-card">
              <template #header>
                <Image src="https://fakeimg.pl/600x400/282828/fff/?text=Cierre+Ciego" alt="Cierre Ciego" preview class="w-full object-cover h-48 card-img" />
              </template>
              <template #title>Cierre de Caja (Ciego)</template>
              <template #content>
                <ol class="list-decimal pl-5 space-y-2 text-sm font-bold" style="color: var(--text-app)">
                  <li>Para terminar tu jornada, presiona <strong class="text-indigo-600 dark:text-indigo-400">Cerrar Turno</strong> en la pantalla de Caja.</li>
                  <li>Debes declarar el efectivo y los vouchers que cuentas físicamente en tus manos (Cierre ciego).</li>
                  <li>Al confirmar, la sesión se cierra y se imprime un resumen automático de todas las operaciones para los administradores.</li>
                </ol>
              </template>
            </Card>
          </div>
        </TabPanel>

        <!-- Pestaña 3: Inventario y Gestión -->
        <TabPanel value="2">
          <div class="max-w-4xl">
            <Accordion value="0">
              <AccordionPanel value="0">
                <AccordionHeader>¿Cómo creo un producto nuevo o de pesaje?</AccordionHeader>
                <AccordionContent>
                  <div class="flex flex-col md:flex-row gap-6 items-start mt-3">
                    <Image src="https://fakeimg.pl/400x300/282828/fff/?text=Crear+Producto" preview alt="Crear Producto" class="w-full md:w-1/3 rounded overflow-hidden shadow" />
                    <div class="flex-1 text-sm font-bold" style="color: var(--text-app)">
                      <p class="mb-2">Ve a <strong>Inventario</strong> y haz clic en <strong>Nuevo Producto</strong>.</p>
                      <ul class="list-disc pl-5 space-y-2">
                        <li>Rellena el Código de Barras y el Nombre descriptivo.</li>
                        <li>Asígnalo a una <strong>Categoría</strong>.</li>
                        <li>Ingresa el Costo y el Precio de Venta (el margen se calculará solo).</li>
                        <li>Si es un producto a granel (ej. Pan, Clavos), marca la opción <strong>Se vende por peso/granel</strong>.</li>
                      </ul>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionPanel>
              
              <AccordionPanel value="1">
                <AccordionHeader>¿Cómo hacer un ajuste rápido de stock?</AccordionHeader>
                <AccordionContent>
                  <div class="flex flex-col md:flex-row gap-6 items-start mt-3">
                    <Image src="https://fakeimg.pl/400x300/282828/fff/?text=Ajuste+Stock" preview alt="Ajuste Stock" class="w-full md:w-1/3 rounded overflow-hidden shadow" />
                    <div class="flex-1 text-sm font-bold" style="color: var(--text-app)">
                      <p class="mb-2">A veces el stock en sistema no coincide con el real en bodega. Para solucionarlo sin hacer una compra formal:</p>
                      <ul class="list-disc pl-5 space-y-2">
                        <li>Ve a <strong>Ajuste Stock</strong> en el menú.</li>
                        <li>Busca y selecciona el producto con diferencias.</li>
                        <li>Revisa su stock actual en pantalla y escribe en "Nuevo Stock" la cantidad que contaste a mano.</li>
                        <li>Agrega un justificativo (ej. "Merma", "Conteo manual") y dale a <strong>Aplicar Ajuste</strong>.</li>
                      </ul>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionPanel>
              
              <AccordionPanel value="2">
                <AccordionHeader>¿Cómo cobrar los Fiados antiguos de clientes?</AccordionHeader>
                <AccordionContent>
                  <div class="flex flex-col md:flex-row gap-6 items-start mt-3">
                    <Image src="https://fakeimg.pl/400x300/282828/fff/?text=Abonos+y+Fiados" preview alt="Cobrar Deudas" class="w-full md:w-1/3 rounded overflow-hidden shadow" />
                    <div class="flex-1 text-sm font-bold" style="color: var(--text-app)">
                      <p class="mb-2">Sigue estos pasos para recibir abonos de clientes fiados:</p>
                      <ul class="list-disc pl-5 space-y-2">
                        <li>Entra al módulo <strong>Clientes</strong> en el menú izquierdo.</li>
                        <li>Busca al cliente moroso en la tabla y haz clic en <strong>Ver Ficha</strong>.</li>
                        <li>Se abrirá una vista con su deuda actual. Haz clic en el botón verde <strong>Abonar a Deuda</strong>.</li>
                        <li>Selecciona el monto que el cliente te está entregando, si te paga en Efectivo/Tarjeta y haz clic en Confirmar.</li>
                        <li>El monto se restará automáticamente, priorizando las deudas más antiguas, y generará un recibo de pago instantáneo.</li>
                      </ul>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionPanel>
            </Accordion>
          </div>
        </TabPanel>
      </TabPanels>
    </Tabs>
    
    <!-- Modal de Galería a Pantalla Completa -->
    <Dialog v-model:visible="mostrarModal" modal dismissable-mask :closable="false" class="gallery-modal" content-class="p-0 overflow-hidden bg-black/90">
      <div class="relative w-screen h-screen flex flex-col items-center justify-center p-4">
        <!-- Imagen Principal -->
        <div class="max-w-5xl w-full h-[80vh] flex items-center justify-center">
          <transition name="fade" mode="out-in">
            <img 
              :key="currentIdxModal"
              :src="imagenesVentaSimple[currentIdxModal].src" 
              :alt="imagenesVentaSimple[currentIdxModal].alt"
              class="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
            />
          </transition>
        </div>

        <!-- Controles Modal -->
        <div class="absolute inset-y-0 left-4 flex items-center">
          <Button icon="pi pi-chevron-left" rounded severity="secondary" @click="cambiarImagenModal('prev')" class="bg-white/20 hover:bg-white/40 border border-white/20 text-white h-12 w-12 shadow-2xl" />
        </div>
        <div class="absolute inset-y-0 right-4 flex items-center">
          <Button icon="pi pi-chevron-right" rounded severity="secondary" @click="cambiarImagenModal('next')" class="bg-white/20 hover:bg-white/40 border border-white/20 text-white h-12 w-12 shadow-2xl" />
        </div>

        <!-- Pie de Modal (Info) -->
        <div class="absolute bottom-10 left-0 right-0 flex flex-col items-center gap-4">
          <h3 class="text-white text-xl font-bold bg-black/40 px-4 py-1 rounded-lg backdrop-blur-md">
            {{ imagenesVentaSimple[currentIdxModal].alt }}
          </h3>
          <div class="flex gap-2">
            <div 
              v-for="(_, i) in imagenesVentaSimple" 
              :key="i"
              class="w-2.5 h-2.5 rounded-full transition-all cursor-pointer"
              :class="currentIdxModal === i ? 'bg-indigo-400 w-8 scale-110' : 'bg-white/30'"
              @click="currentIdxModal = i"
            />
          </div>
        </div>

        <!-- Botón Cerrar -->
        <Button 
          icon="pi pi-times" 
          rounded 
          severity="danger" 
          @click="mostrarModal = false" 
          class="absolute top-6 right-6 h-12 w-12 shadow-2xl border-2 border-white/10" 
        />
      </div>
    </Dialog>

  </div>
</template>
<script setup lang="ts">
const currentIdx = ref(0)
const currentIdxModal = ref(0)
const mostrarModal = ref(false)
const ventaSimpleGallery = ref<HTMLElement | null>(null)

const imagenesVentaSimple = [
  { src: '/Ayuda/Venta Simple/Realizar una Venta Simple 1.png', alt: 'Paso 1: Buscar en el POS' },
  { src: '/Ayuda/Venta Simple/Realizar una Venta Simple 2.png', alt: 'Paso 2: Cobrar (F12)' },
  { src: '/Ayuda/Venta Simple/Realizar una Venta Simple 3.png', alt: 'Paso 3: Confirmar Pago' },
  { src: '/Ayuda/Venta Simple/Realizar una Venta Simple 4.png', alt: 'Paso 4: Comprobante de Venta' }
]

function abrirImagenEnModal(idx: number) {
  currentIdxModal.value = idx
  mostrarModal.value = true 
}

function cambiarImagenModal(dir: 'next' | 'prev') {
  if (dir === 'next') {
    currentIdxModal.value = (currentIdxModal.value + 1) % imagenesVentaSimple.length
  } else {
    currentIdxModal.value = (currentIdxModal.value - 1 + imagenesVentaSimple.length) % imagenesVentaSimple.length
  }
}

function scrollGallery(dir: 'next' | 'prev') {
  if (!ventaSimpleGallery.value) return
  const container = ventaSimpleGallery.value
  const itemWidth = container.clientWidth
  
  if (dir === 'next') {
    if (currentIdx.value < imagenesVentaSimple.length - 1) {
      container.scrollBy({ left: itemWidth, behavior: 'smooth' })
    } else {
      container.scrollTo({ left: 0, behavior: 'smooth' })
    }
  } else {
    if (currentIdx.value > 0) {
      container.scrollBy({ left: -itemWidth, behavior: 'smooth' })
    } else {
      container.scrollTo({ left: container.scrollWidth, behavior: 'smooth' })
    }
  }
}

function onScrollGallery(e: Event) {
  const container = e.target as HTMLElement
  const scrollLeft = container.scrollLeft
  const itemWidth = container.clientWidth
  currentIdx.value = Math.round(scrollLeft / itemWidth)
}
</script>

<style scoped>
.ayuda-container {
  padding: 1rem;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.ayuda-card {
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--border-subtle);
  background: var(--bg-surface);
}

:deep(.p-card-header .p-image-preview-indicator) {
  background: rgba(0,0,0,0.4);
  backdrop-filter: blur(2px);
}

:deep(.p-card-content) {
  padding-top: 0.5rem;
}

:deep(.p-tablist-nav) {
  border-bottom: 2px solid var(--border-subtle);
  margin-bottom: 1rem;
}

.ayuda-card :deep(.p-card-header) {
  overflow: hidden;
}

.card-gallery {
  padding-bottom: 0.5rem;
}

.hidden-scrollbar::-webkit-scrollbar {
  display: none;
}
.hidden-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.card-gallery {
  scroll-behavior: smooth;
}

/* Transiciones */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Ajustes Modal */
:deep(.gallery-modal .p-dialog-header),
:deep(.gallery-modal .p-dialog-footer) {
  display: none;
}
</style>
