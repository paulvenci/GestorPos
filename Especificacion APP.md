# Documento de Especificaciones Técnicas: Sistema de Punto de Venta (POS)

Este documento define la arquitectura, el stack tecnológico y los requerimientos funcionales para el desarrollo de un Sistema de Punto de Venta moderno, escalable y basado en la nube.

---

## 1. Stack Tecnológico

| Capa | Tecnología Principal | Descripción |
| :--- | :--- | :--- |
| **Frontend** | Nuxt 4 | Framework para PWA y SSR (Usar estrictamente Nuxt 4 para evitar problemas de compatibilidad). |
| **Estilos UI** | PrimeVue + Tailwind CSS | Uso de lo último de PrimeVue para componentes UI complejos y Tailwind CSS para layouts y utilidad. |
| **Backend & DB** | Supabase (PostgreSQL) | Base de datos relacional robusta. Provee API REST autogenerada y capacidades de tiempo real. |
| **Networking** | ofetch / Nativo | **ESTRICTAMENTE PROHIBIDO usar Axios** debido a problemas críticos de seguridad recientes. |
| **Autenticación** | Supabase Auth | Gestión de usuarios, roles (Admin, Cajero) y sesiones seguras. |
| **Librerías Extra** | JsBarcode | Generación de códigos de barras en el cliente (estándares CODE128 o EAN-13). |

---

## 2. Esquema de Base de Datos (PostgreSQL)

El sistema requiere las siguientes entidades principales para garantizar la integridad referencial:

*   **`perfiles`**: Vinculada a Supabase Auth. Almacena el rol del usuario (administrador, cajero) y sus datos personales.
*   **`productos`**: Almacena ID, nombre, SKU/código de barras, precio, costo, categoría y stock actual.
*   **`turnos_caja`**: Registra la sesión de un cajero.
    *   *Campos:* ID, `id_usuario`, `fecha_apertura`, `monto_inicial`, `fecha_cierre`, `ventas_registradas`, `monto_declarado`, observaciones, estado (abierto/cerrado).
*   **`ventas`**: Cabecera de la transacción.
    *   *Campos:* ID, `id_turno`, fecha, subtotal, impuestos, descuentos, total, método_pago.
*   **`detalle_ventas`**: Líneas de la factura.
    *   *Campos:* ID, `id_venta`, `id_producto`, cantidad, precio_unitario, subtotal.

---

## 3. Requerimientos Funcionales por Módulo

### 📦 Módulo de Gestión de Turnos y Caja
*   **Apertura de Caja:** El sistema debe exigir el ingreso de un "Monto Inicial" (base) para abrir un turno.
*   **Bloqueo de Interfaz:** La pantalla de ventas (POS) debe estar deshabilitada o redirigir al usuario si este no tiene un turno activo.
*   **Cierre de Caja:** El sistema calculará el total de transacciones realizadas durante el turno. El cajero deberá ingresar el monto físico real contado.
*   **Arqueo:** El sistema generará un reporte automático de diferencias (faltante/sobrante) que quedará registrado en la base de datos junto con las observaciones del cajero.

### 💰 Módulo de Ventas (POS)
*   **Búsqueda y Selección:** Integración de un campo de texto con auto-focus optimizado para lectores físicos de códigos de barras, además de búsqueda manual por nombre o selección visual en un catálogo.
*   **Gestión del Carrito:** Capacidad de modificar cantidades, aplicar descuentos (si el rol lo permite) y calcular impuestos en tiempo real.
*   **Transacciones Seguras:** El procesamiento del pago debe ejecutar una función RPC (Stored Procedure) en Supabase.
    *   *Nota:* Esto garantizará que la creación del registro en `ventas`, la inserción en `detalle_ventas` y el descuento del stock en `productos` ocurran en una única transacción atómica. Si algo falla, se revierte todo.

### 🏷️ Módulo de Inventario y Códigos de Barras
*   **Gestión de Catálogo:** Operaciones CRUD (Crear, Leer, Actualizar, Borrar) para productos.
*   **Selección Múltiple:** Interfaz tipo tabla que permita seleccionar múltiples productos simultáneamente.
*   **Generador de Etiquetas:** Al presionar un botón, el sistema tomará los SKUs de los productos seleccionados y renderizará visualmente los códigos de barras usando **JsBarcode**.
*   **Formato de Impresión:** El sistema aplicará reglas CSS específicas (`@media print`) para formatear la pantalla saliente en dimensiones de etiquetas adhesivas estándar, ocultando la navegación y menús del sistema.

---

## 4. Arquitectura Offline-First y Despliegue

*   **🔌 PWA & Almacenamiento Local:** La APP operará como una Progressive Web App (PWA) habilitada para trabajar sin internet. Se utilizará **Dexie.js (IndexedDB)** junto con Pinia para persistir el catálogo de productos y encolar las transacciones de ventas cuando la red se caiga.
*   **🔄 Sincronización Automática:** Un Service Worker monitoreará el estado de la red para disparar una sincronización mediante llamadas RPC u `ofetch` enviando la cola de transacciones locales hacia Supabase.
*   **🚀 Despliegue en Vercel CI/CD:** El código estará en GitHub y se automatizarán las compilaciones (builds) directamente en la plataforma **Vercel**, gestionando las variables de entorno de producción allí de forma segura.

---

## 5. Interfaz de Usuario (UI) y Experiencia (UX)

Como sistema de primera línea frente al cliente, la imagen y la eficiencia operativa son críticas:

*   **🎨 Diseño Premium y Branding:** Personalización profunda del tema de **PrimeVue (Aura/Lara)** para alinearse con los colores corporativos. Se debe evitar el aspecto de "plantilla por defecto", empleando paletas HSL vibrantes, sombras suaves y `glassmorphism` donde aporte elegancia sin saturar.
*   **⚡ Ergonomía y Atajos de Teclado:** Operatividad sin ratón. El cajero debe poder buscar, modificar carrito, aplicar descuentos y procesar el cobro (`Ej: F2`) enteramente mediante atajos de teclado para extrema velocidad.
*   **🔔 Feedback Visual y Sonoro:** Uso extensivo de *Toasts* para notificaciones de éxito/error, animaciones sutiles al agregar ítems al carrito, retroalimentación auditiva (beep) al escanear correctamente un código de barras.
*   **⏳ Prevención del Layout Shift:** Uso de componentes *Skeleton Loader* de PrimeVue mientras los datos de Supabase se están cargando para evitar "saltos" en la interfaz.

---

## 6. Requerimientos No Funcionales y Seguridad

*   **🔒 Row Level Security (RLS):** Se implementarán políticas de seguridad directamente en Supabase. Los cajeros solo tendrán permiso de lectura/escritura sobre los turnos y ventas que ellos mismos generen. Los administradores tendrán acceso global.
*   **📉 Prevención de Stock Negativo:** La base de datos (mediante un constraint `CHECK`) o la función RPC bloquearán cualquier transacción que intente dejar el stock de un producto por debajo de cero, a menos que se configure explícitamente lo contrario.