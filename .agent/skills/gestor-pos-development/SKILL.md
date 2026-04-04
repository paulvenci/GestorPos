---
name: GestorPOS Development Rules
description: Reglas y contexto vital para el desarrollo del Sistema de POS (Nuxt 4, Offline First e integración con Supabase).
---

# Reglas de Desarrollo GestorPOS

Al trabajar en este proyecto, DEBES adherirte estrictamente a estas normas. El incumplimiento de estas normas comprometerá la estabilidad, seguridad y coherencia arquitectónica de la aplicación.

## 1. Stack Tecnológico Estricto
*   **Framework Frontend:** Usa EXCLUSIVAMENTE **Nuxt 4**. No mezcles convenciones ni dependencias de Nuxt 3.
*   **Networking:** Está **ESTRICTAMENTE PROHIBIDO usar `axios`**. Usa `ofetch` (que viene integrado profundamente en el stack de Nuxt usando `$fetch` o `useFetch`) o la API `fetch` nativa. Axios ha presentado vulnerabilidades recientes de seguridad.
*   **Estilos y Componentes UI:** Usa EXCLUSIVAMENTE lo último de **PrimeVue** para los componentes interactivos principales (tablas, modales, botones, inputs) complementado con **Tailwind CSS** para los layouts, márgenes y utilidad. Evita CSS manual a menos que sea estrictamente necesario.
*   **Estado:** Pinia.
*   **Base de datos local:** Dexie.js (Wrapper de IndexedDB).
*   **Backend:** Supabase (Auth + PostgreSQL).

## 2. Arquitectura Offline First (PWA)
*   **Persistencia Local (Dexie.js):**
    *   Toda lectura de catálogo de productos debe intentar leer desde Dexie.js (Base de datos local) primero para asegurar máxima velocidad en la interfaz POS.
    *   Mantén sincronizados los datos locales (Dexie) con Supabase en segundo plano (`background sync`).
*   **Cola de Transacciones:**
    *   Cuando se realiza una "Venta", si la API (Supabase) falla (corte de red), la venta DEBE guardarse en una tabla de Dexie.js local designada para la "Cola Offline".
*   **Service Workers:** Respeta la configuración del Service Worker (PWA) generado por Nuxt para el manejo de caché.

## 3. Integración con Supabase y Seguridad
*   **Llamadas Atómicas (RPC):** Cuando sincronices una venta hacia el backend, NO realices múltiples inserts manuales desde el frontend. Asegúrate de ejecutar Procedimientos Almacenados (RPC) en Supabase para insertar cabeceras (`ventas`), el detalle (`detalle_ventas`) y descontar el stock (`productos`) en una única **transacción**.
*   **Seguridad y RLS:** Confirma siempre que pasas correctamente los tokens de la sesión (`accessToken`) con cada solicitud autenticada a la API de Supabase, porque la DB aplica políticas RLS estrictas.

## 4. Estándares Visuales y Experiencia (Premium UI/UX)
*   Como POS moderno, la interfaz debe verse premium y responsiva en tablets o PCs touch. La **imagen vende**, el aspecto estético nunca puede ser un "Minimum Viable Product".
*   Utiliza los componentes pre-diseñados y temas generados por **PrimeVue** asegurando plena compatibilidad y coherencia con el **Modo Oscuro (Dark Mode)**, respaldado por las utilidades de Tailwind. Personaliza la paleta (nada de "colores por defecto aburridos" de PrimeVue, aplica los primarios del proyecto).
*   **Ergonomía de Alta Velocidad:** Todo flujo de caja crítico DEBE permitir operación 100% por atajos de teclado (e.g. presionar Enter para cobrar, Esc para cancelar, Flechas para navegar la tabla).
*   **Micro-animaciones y Feedback:** Es mandatorio usar `Toast` (PrimeVue) para confirmar éxito/error de transacciones, y animaciones de transición sutiles al cambiar estados.
*   **Anti Layout-Shift (UX):** NUNCA dejes componentes vacíos que salten al cargar. Utiliza *Skeleton Loaders* de PrimeVue obligatoriamente al esperar datos asíncronos desde Supabase.
*   Prioriza una excelente experiencia de uso del lector de códigos de barra (Auto-focus y captura de eventos nativa por teclado, no dependiente de clicks).
