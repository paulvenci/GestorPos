# Plan de Implementación: Módulo de Compras Inteligente

Este módulo permitirá gestionar de manera eficiente el abastecimiento del local, pasando de una lista manual a un sistema que organiza pedidos por proveedor automáticamente.

## User Review Required

> [!IMPORTANT]
> **Lógica de Asociación:** El sistema utilizará la tabla de mapeos de la IA (`ai_mapeo_proveedores`) y el historial de compras para saber a qué proveedor corresponde cada producto. Si es un producto nuevo, se asignará manualmente la primera vez.

## Flujo de Trabajo Propuesto

1. **Lista de Faltantes:** El usuario agrega productos a una lista única (similar al cuaderno), viendo stock actual y sugerencias.
2. **Generación de Pedidos:** Al presionar "Organizar Pedidos", el sistema divide la lista en múltiples Órdenes de Compra (OC), una por cada proveedor detectado.
3. **Gestión de Estados:** 
    - `pendiente_pedido`: Creado pero no enviado.
    - `pedido_realizado`: Enviado al proveedor (WhatsApp/PDF).
    - `recibido_e_ingresado`: Stock ya sumado al sistema tras recibir factura.
    - `anulado`: Cancelado.

## Proposed Changes

### 1. Base de Datos (Supabase)

#### [NEW] [20260506000100_modulo_compras.sql](file:///d:/Electrosun/GestorPOS/supabase/migrations/20260506000100_modulo_compras.sql)
- `proveedores`: Directorio de empresas (RUT, Nombre, Contacto).
- `pedidos_compra`: Cabecera (ID_Proveedor, Estado, Fecha, Total Estimado).
- `detalle_pedidos`: Líneas (ID_Producto, Cantidad, Precio última compra).

### 2. UI: Panel de Compras y Generador

#### [NEW] [compras/index.vue](file:///d:/Electrosun/GestorPOS/app/pages/admin/compras/index.vue)
- Vista general de todos los pedidos y sus estados.
- Botón para crear nueva "Lista de Compras".

#### [NEW] [compras/generador.vue](file:///d:/Electrosun/GestorPOS/app/pages/admin/compras/generador.vue)
- Interfaz de "Lista única" donde se agregan ítems libremente del inventario.
- Mostrará quién fue el último proveedor de cada ítem.
- Botón para procesar y dividir en OCs.

### 3. Integración con Recepción IA y Recepción Manual

#### [MODIFY] [recepcion-mercaderia.vue](file:///d:/Electrosun/GestorPOS/app/pages/admin/recepcion-mercaderia.vue)
- **Flujo IA:** El flujo actual de fotos, pero con el añadido de buscar OCs pendientes del proveedor detectado para cruzar datos.
- **Flujo Manual:** 
    - Opción para seleccionar un pedido pendiente de la lista.
    - Carga automática de los ítems del pedido en la tabla de conciliación.
    - El usuario solo confirma o ajusta cantidades y costos antes de guardar.

### 4. Gestión de Proveedores (UI)

#### [NEW] [proveedores/index.vue](file:///d:/Electrosun/GestorPOS/app/pages/admin/proveedores/index.vue)
- CRUD para gestionar el directorio (RUT, Nombre, Contacto).

## Verification Plan

### Automated Tests
- Validar que un pedido se divida correctamente si contiene productos de proveedores distintos.
- Validar el cambio de estado de los productos en el inventario tras la recepción (tanto por IA como manual).

### Manual Verification
- Simular un pedido de 10 ítems -> Recibirlo manualmente (sin foto) -> Verificar stock.
- Simular un pedido de 10 ítems -> Recibirlo mediante foto IA -> Verificar cruce de datos.
