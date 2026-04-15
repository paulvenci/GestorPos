<template>
  <div class="ayuda-container">
    <div class="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
      <div>
        <h1 class="text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
          <i class="pi pi-question-circle text-indigo-500"></i> Centro de Ayuda
        </h1>
        <p class="text-slate-600 dark:text-slate-400 mt-2 text-sm max-w-2xl">
          Encuentra guías visuales y pasos detallados para realizar tus operaciones diarias en GestorPOS. Haz clic en las imágenes para ampliarlas.
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
            
            <Card class="ayuda-card">
              <template #header>
                <!-- Carousel / Scroll Horizontal de múltiples imágenes -->
                <div class="flex overflow-x-auto gap-2 p-2 snap-x card-gallery hidden-scrollbar">
                  <Image src="https://fakeimg.pl/600x400/282828/fff/?text=Paso+1:+Buscar" alt="Paso 1" preview class="w-64 h-40 object-cover rounded shadow-sm snap-center shrink-0 border border-slate-200 dark:border-slate-700" />
                  <Image src="https://fakeimg.pl/600x400/282828/fff/?text=Paso+2:+Cobrar" alt="Paso 2" preview class="w-64 h-40 object-cover rounded shadow-sm snap-center shrink-0 border border-slate-200 dark:border-slate-700" />
                  <Image src="https://fakeimg.pl/600x400/282828/fff/?text=Paso+3:+Confirmar" alt="Paso 3" preview class="w-64 h-40 object-cover rounded shadow-sm snap-center shrink-0 border border-slate-200 dark:border-slate-700" />
                </div>
              </template>
              <template #title>Realizar una Venta Simple</template>
              <template #content>
                <ol class="list-decimal pl-5 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <li>Busca un producto por su Nombre o Código de Barras (SKU) en el buscador superior.</li>
                  <li>Presiona <strong>Enter</strong> o usa el lector láser. El producto se agregará a la canasta.</li>
                  <li>Al terminar, pulsa el botón <strong>Cobrar (F12)</strong>.</li>
                  <li>Selecciona el medio de pago, ingresa el dinero recibido y confirma el pago.</li>
                </ol>
              </template>
            </Card>

            <Card class="ayuda-card">
              <template #header>
                <Image src="https://fakeimg.pl/600x400/282828/fff/?text=Consultar+Precio" alt="Consultar Precio" preview class="w-full object-cover h-48 card-img" />
              </template>
              <template #title>Consultar Precio (F10)</template>
              <template #content>
                <ol class="list-decimal pl-5 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <li>Presiona la tecla <strong>F10</strong> en cualquier momento dentro de la pantalla del POS.</li>
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
                <ol class="list-decimal pl-5 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <li>Agrega los productos que el cliente llevará.</li>
                  <li>Presiona <strong>Cobrar (F12)</strong>.</li>
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
                <ol class="list-decimal pl-5 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <li>Dirígete al apartado <strong>Caja</strong> en el menú lateral.</li>
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
                <ol class="list-decimal pl-5 space-y-2 text-sm text-slate-600 dark:text-slate-300">
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
                <ol class="list-decimal pl-5 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <li>Para terminar tu jornada, presiona <strong>Cerrar Turno</strong> en la pantalla de Caja.</li>
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
                    <div class="flex-1 text-sm text-slate-700 dark:text-slate-300">
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
                    <div class="flex-1 text-sm text-slate-700 dark:text-slate-300">
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
                    <div class="flex-1 text-sm text-slate-700 dark:text-slate-300">
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

  </div>
</template>

<script setup lang="ts">
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
  height: 6px;
}
.hidden-scrollbar::-webkit-scrollbar-track {
  background: var(--bg-surface);
}
.hidden-scrollbar::-webkit-scrollbar-thumb {
  background-color: var(--border-strong);
  border-radius: 20px;
}
</style>
