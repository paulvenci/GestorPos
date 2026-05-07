---
pdf_options:
  format: Letter
  margin:
    top: 20mm
    bottom: 20mm
    left: 18mm
    right: 18mm
stylesheet:
  - https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap
body_class: plan
---

<style>
  body.plan {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    color: #1a1a2e;
    line-height: 1.6;
    font-size: 11px;
  }
  h1 {
    font-size: 26px;
    font-weight: 900;
    color: #0f0f23;
    border-bottom: 3px solid #6366f1;
    padding-bottom: 10px;
    margin-top: 0;
  }
  h2 {
    font-size: 18px;
    font-weight: 700;
    color: #312e81;
    margin-top: 28px;
    border-left: 4px solid #6366f1;
    padding-left: 12px;
  }
  h3 {
    font-size: 14px;
    font-weight: 700;
    color: #4338ca;
    margin-top: 20px;
  }
  h4 {
    font-size: 12px;
    font-weight: 600;
    color: #4f46e5;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
    font-size: 10.5px;
  }
  th {
    background: #312e81;
    color: white;
    padding: 8px 10px;
    text-align: left;
    font-weight: 600;
  }
  td {
    padding: 6px 10px;
    border-bottom: 1px solid #e5e7eb;
  }
  tr:nth-child(even) td {
    background: #f5f3ff;
  }
  code {
    background: #f1f5f9;
    padding: 1px 5px;
    border-radius: 3px;
    font-size: 10px;
  }
  pre {
    background: #1e1b4b;
    color: #e0e7ff;
    padding: 14px;
    border-radius: 8px;
    font-size: 10px;
    line-height: 1.5;
    overflow-x: auto;
  }
  pre code {
    background: none;
    color: inherit;
    padding: 0;
  }
  blockquote {
    border-left: 4px solid #6366f1;
    margin: 16px 0;
    padding: 12px 16px;
    background: #eef2ff;
    border-radius: 0 8px 8px 0;
    font-style: normal;
  }
  blockquote strong {
    color: #312e81;
  }
  .alert-important {
    background: #fef3c7;
    border-left: 4px solid #f59e0b;
    padding: 12px 16px;
    border-radius: 0 8px 8px 0;
    margin: 14px 0;
  }
  .alert-tip {
    background: #ecfdf5;
    border-left: 4px solid #10b981;
    padding: 12px 16px;
    border-radius: 0 8px 8px 0;
    margin: 14px 0;
  }
  .alert-warning {
    background: #fff1f2;
    border-left: 4px solid #ef4444;
    padding: 12px 16px;
    border-radius: 0 8px 8px 0;
    margin: 14px 0;
  }
  hr {
    border: none;
    border-top: 2px solid #e5e7eb;
    margin: 24px 0;
  }
  ul {
    padding-left: 20px;
  }
  li {
    margin-bottom: 4px;
  }
  .page-break { page-break-after: always; }
</style>

# 📊 Plan Estratégico de Crecimiento de Ventas
## Panadería y Minimarket — Basado en Datos Reales del POS

*Elaborado el 21 de abril de 2026 a partir del análisis completo de la base de datos GestorPOS.*
*Período analizado: ~5 días de operación | 1,000 transacciones | $2,832,470 CLP en ventas.*

---

## 1. 🔍 Diagnóstico del Negocio (Situación Actual)

### Métricas Clave

| Métrica | Valor Actual | Observación |
|---|---|---|
| **Ventas totales (período)** | $2,832,470 | ~5 días de operación |
| **Venta diaria promedio** | $708,118 | Base sólida |
| **Ticket promedio** | $2,832 | ⚠️ **MUY BAJO** |
| **Transacciones/día** | ~250 | Buen flujo de clientes |
| **Items por carrito** | 1.9 | ⚠️ Casi todos compran 1-2 cosas |
| **Productos activos** | 848 | Catálogo amplio |
| **Productos vendidos** | 320 de 848 | Solo el 37.7% se vende |
| **Productos nunca vendidos** | 528 | 62.3% es peso muerto |
| **Productos sin stock** | 82 | Oportunidad perdida |

<div class="alert-important">
<strong>⚠️ Los 3 problemas principales identificados:</strong><br>
1. <strong>Ticket promedio extremadamente bajo ($2,832)</strong> — Los clientes compran pocas cosas<br>
2. <strong>48.2% de las ventas son de 1 solo producto</strong> — No hay venta cruzada<br>
3. <strong>62% del catálogo no se mueve</strong> — Capital inmovilizado en estantes
</div>

---

## 2. 📈 Análisis Detallado

### 2.1 🕐 Horas Pico y Horas Muertas

```
Hora     Ventas   Ingreso      Clasificación
─────────────────────────────────────────────
 7:00      87    $216,490      🔥 HORA PICO AM
 8:00      90    $245,959      🔥 HORA PICO AM
 9:00      62    $212,113      ▲ Alto
10:00      55    $176,435      ● Medio
11:00      62    $198,740      ● Medio
12:00      60    $160,340      ● Medio
13:00      61    $175,310      ● Medio
14:00      53    $128,240      ▼ Bajo
15:00      44    $112,580      ❄️ HORA MUERTA
16:00      74    $214,690      ▲ Alto (repunte)
17:00      82    $212,100      ▲ Alto
18:00     106    $292,120      🔥🔥 HORA PICO PM
19:00     105    $296,210      🔥🔥 HORA PICO PM
20:00      43    $111,640      ▼ Bajo
21:00       7    $ 17,540      ❄️ Cierre
```

**Hallazgos:**
- **2 picos claros:** 7-9 AM (mañana) y 18-19 PM (tarde/noche)
- **Hora muerta:** 14:00-15:00 — baja significativa
- **La hora más rentable es 19:00** ($296,210)
- El repunte de las 16-17 hrs sugiere demanda de "once" (merienda)

### 2.2 📅 Días de la Semana

| Día | Ventas | Ingreso | Observación |
|---|---|---|---|
| **Sábado** | 278 | $879,100 | 🏆 **Mejor día** |
| **Viernes** | 252 | $672,350 | Segundo mejor |
| **Domingo** | 224 | $616,320 | Tercero |
| **Jueves** | 128 | $356,770 | Medio |
| **Lunes** | 118 | $307,930 | Más bajo |

<div class="alert-tip">
<strong>💡 Dato clave:</strong> Los fines de semana generan ~53% de los ingresos. El sábado es el rey. Hay espacio importante para crecer en días de semana.
</div>

### 2.3 🏆 Productos Estrella (Top Generadores de Ingreso)

| # | Producto | Ingreso | Uds | Margen | Categoría |
|---|---|---|---|---|---|
| 1 | **Pan corriente** | $562,608 | 239 kg | 34.0% | Abarrotes |
| 2 | Huevos | $31,840 | 97 | 33.0% | Abarrotes |
| 3 | Empanadas de carne | $26,000 | 13 | **99.4%** | Abarrotes |
| 4 | Donas | $25,200 | 21 | N/A | Abarrotes |
| 5 | Queso de campo | $20,500 | 1.7 kg | 35.4% | Lácteos |
| 6 | Palta | $18,500 | 2.5 kg | 35.4% | Frutas |
| 7 | Cecina Lisa Pacel | $16,530 | 1.5 kg | N/A | Cecinas |
| 8 | Lays | $16,230 | 3 | 35.3% | Snacks |
| 9 | Torta En Caja | $15,000 | 6 | N/A | Snacks |
| 10 | Cecina Pacel Q. Chancho | $14,220 | 1.2 kg | N/A | Cecinas |

<div class="alert-important">
<strong>⚠️ El pan corriente representa el 19.9% de todos los ingresos.</strong> Es tu ancla de tráfico — la gente viene por el pan. La pregunta clave es: <strong>¿qué más les podemos vender cuando vienen por el pan?</strong>
</div>

### 2.4 🛒 Análisis de Canasta (Qué compran juntos)

| Combinación | Frecuencia |
|---|---|
| Pan + Huevos | 17 veces |
| Pan + Cecina Lisa Pacel | 11 veces |
| Pan + Donas | 10 veces |
| Pan + Palta | 10 veces |
| Pan + Cecina Jamonada | 8 veces |
| Pan + Queso crema | 6 veces |
| Pan + Mantequilla | 5 veces |
| Pan + Queso Chancho | 5 veces |
| Pan + Jamón sandwich | 5 veces |

**Patrón claro:** El cliente tipo compra **pan + 1 acompañamiento** (cecina, queso, palta, huevos). Esto es una oportunidad enorme de venta cruzada.

### 2.5 📂 Categorías por Rendimiento

| Categoría | Ingreso | % del Total | Margen |
|---|---|---|---|
| Abarrotes (inc. pan) | $839,268 | 29.6% | 50.4% |
| Snacks | $141,550 | 5.0% | **85.9%** |
| Bebidas | $111,550 | 3.9% | **95.5%** |
| Lácteos | $107,480 | 3.8% | 94.9% |
| Cecinas | $86,660 | 3.1% | **84.4%** |
| Congelados | $83,220 | 2.9% | 70.5% |
| Limpieza | $38,570 | 1.4% | 35.8% |
| Aseo personal | $28,970 | 1.0% | 36.9% |

<div class="page-break"></div>

## 3. 🚀 PLAN DE ACCIÓN PARA AUMENTAR VENTAS

### 🎯 ESTRATEGIA 1: Aumentar el Ticket Promedio (de $2,832 a $4,500+)
**Meta: +60% ticket promedio = +$425K/día adicional**

#### Acciones inmediatas (Semana 1-2):

**1. "Combo Desayuno/Once"** — Crear combos físicos visibles:
   - **Combo Pan + Cecina + Bebida** → Descuento de $200-300 vs compra individual
   - **Combo Pan + Palta + Huevos** → "Desayuno completo"
   - **Combo Pan + Mantequilla + Queso Crema** → "Pack Once"
   - Poner cartel grande en la caja y en la zona del pan

**2. Zona de "impulso" en la caja:**
   - Colocar al lado de la caja: Alfajores ($700-750), Coyak ($150), Braunichoc ($750), chicles
   - Los snacks tienen **margen del 85-95%** — cada venta impulso es pura ganancia
   - Asegurar que Quequitos Mini ($250) y Calzones Rotos ($200) estén siempre visibles

**3. Sugerencia verbal del cajero:**
   - Cuando alguien compra pan: *"¿Le agrego unos huevos/palta/cecina?"*
   - Entrenar al cajero para **SIEMPRE** ofrecer un producto complementario
   - Si solo el 20% acepta → ~50 ventas extra/día × $2,000 = **$100K/día extra**

#### Acciones medio plazo (Semana 3-4):

**4. Programa "2do producto con descuento":**
   - Ej: *"Lleva tu pan y agrega cualquier cecina con 10% off"*
   - Como las cecinas tienen buen margen, el descuento se absorbe fácilmente

---

### 🎯 ESTRATEGIA 2: Aumentar el Flujo en Horas Muertas
**Meta: +30 transacciones/día en horarios bajos**

**1. Promoción "Hora Feliz" (14:00-16:00):**
   - Las empanadas tienen **99.4% de margen** → "2 empanadas por $3,500" (vs $4,000)
   - Café/bebida caliente + pastel a precio combo en la tarde

**2. "Pan fresco de la tarde" (16:00-17:00):**
   - Hornear una tanda de pan fresco a las 16:00
   - Comunicar: *"Pan recién salido del horno a las 4 PM"*
   - Capitalizar el repunte natural de las 16-17 hrs

**3. Lunes y Martes — Días de ofertas:**
   - Ofrecer "Lunes de Cecinas" o "Martes de Lácteos" con 5-10% descuento
   - Atraer flujo en días bajos

---

### 🎯 ESTRATEGIA 3: Optimizar el Catálogo (528 productos muertos)
**Meta: Liberar capital + espacio para productos que SÍ venden**

<div class="alert-warning">
<strong>🚨 528 de 848 productos (62%) NUNCA se han vendido.</strong> Esto es dinero estancado en estantes que no genera retorno.
</div>

**1. Auditoría inmediata del inventario:**
   - Identificar los 528 productos sin ventas
   - Clasificar en: a) productos nuevos aún sin tiempo, b) productos definitivamente muertos
   - Los "muertos" → liquidar con 20-30% off o devolver al proveedor

**2. Reducir SKUs improductivos:**
   - Consolidar variantes innecesarias del mismo producto
   - Limpiar categorías duplicadas (snacks/Snacks, bebidas/Bebidas)

**3. Reinvertir en lo que SÍ vende:**
   - Nunca quedarse sin stock de los Top 20
   - **82 productos sin stock** = ventas perdidas todos los días
   - Pan, Huevos, Empanadas de carne, Donas — son tu motor

---

### 🎯 ESTRATEGIA 4: Maximizar los Fines de Semana

**1. Sábado = día de promociones especiales:**
   - "Pack Fin de Semana" (cecinas + pan + salsas para asado)
   - Tortas/pasteles más visibles (Torta en Caja genera $2,500/ticket)
   - Helados/congelados destacados

**2. Prepararse para la demanda:**
   - Doble stock de pan, cecinas, quesos y empanadas para sáb/dom
   - Suficiente cambio en efectivo

---

### 🎯 ESTRATEGIA 5: Potenciar Productos de Alto Margen

| Producto/Categoría | Margen | Acción Recomendada |
|---|---|---|
| Empanadas de carne | **99.4%** | 🔥 Aumentar producción, combo, visibilidad máxima |
| Snacks (categoría) | **85.9%** | Expandir variedad, poner en zona de impulso |
| Bebidas | **95.5%** | Asegurar stock frío, promocionar con combos |
| Cecinas | **84.4%** | Sugerir siempre con pan, crear "picada lista" |
| Confitería | **74.3%** | Alfajores y chocolates en caja |
| Galletas | **67.7%** | Poner cerca del pan/pastelería |

<div class="alert-tip">
<strong>💡 Las Empanadas de Carne son tu producto más rentable.</strong> Cada empanada de $2,000 tiene un costo de ~$12. Vender 10 más por día = <strong>$20K extra de utilidad pura diaria.</strong>
</div>

---

### 🎯 ESTRATEGIA 6: Diversificar Métodos de Pago

1. **Promover transferencias** con cartel visible del QR
2. **Aceptar tarjeta sin mínimo** — no poner barreras de compra
3. **Considerar débito contactless** — reduce fricciones y tiempos

---

## 4. 📋 Resumen de Impacto Esperado

| Estrategia | Impacto Diario Estimado | Prioridad |
|---|---|---|
| **Aumentar ticket** (combos + impulso + sugerencia) | +$150K - $250K | 🔴 **ALTA** |
| **Hora feliz + pan de la tarde** | +$50K - $80K | 🟡 MEDIA |
| **Limpiar catálogo muerto** | Liberar capital + espacio | 🔴 **ALTA** |
| **Nunca sin stock Top 20** | +$30K - $50K | 🔴 **ALTA** |
| **Combo fin de semana** | +$50K sáb/dom | 🟡 MEDIA |
| **Potenciar empanadas** | +$20K - $40K utilidad | 🔴 **ALTA** |

<div class="alert-important">
<strong>Meta Global:</strong> De <strong>$708K/día</strong> actual → <strong>$950K-1.1M/día</strong> en 30 días = <strong>+34% a +55% de crecimiento</strong>
</div>

---

## 5. 🗓️ Cronograma de Implementación

### Semana 1 (Inmediato — Costo $0)
- ☐ Cajero ofrece producto complementario en cada venta de pan
- ☐ Mover snacks y confitería a la zona de caja
- ☐ Reponer stock de los 82 productos agotados (priorizando Top 20)
- ☐ Crear cartel de combos (pan+cecina, pan+huevos, etc.)

### Semana 2
- ☐ Implementar "Hora Feliz" de empanadas 14:00-16:00
- ☐ Hornear pan fresco a las 16:00 (comunicar con cartel)
- ☐ Iniciar auditoría de los 528 productos sin movimiento

### Semana 3-4
- ☐ Liquidar productos muertos (ofertas de limpieza de inventario)
- ☐ Implementar promociones por día de semana
- ☐ Evaluar resultados y ajustar

### Mes 2
- ☐ Analizar datos nuevos del POS para medir impacto
- ☐ Ajustar combos según resultados
- ☐ Considerar ampliar horario si hay demanda post 21:30

---

## 6. 💡 Ideas Adicionales para el Mediano Plazo

1. **Programa de fidelidad simple:** Tarjeta de "Compra 10 panes, lleva 1 gratis"
2. **Encargos por WhatsApp:** Tortas, empanadas por docena, pedidos para eventos
3. **Pan congelado para llevar:** Paquete de panes congelados para el fin de semana
4. **Café para llevar:** Un café simple ($500-800) con margen del 80%+ acompaña perfecto al pan
5. **Vitrina caliente visible:** Empanadas y productos calientes generan compra impulsiva

---

<div class="alert-important" style="background: #eef2ff; border-color: #6366f1;">
<strong>🔑 LA CLAVE MÁS IMPORTANTE DE TODO ESTE ANÁLISIS:</strong><br><br>
<strong>250 clientes por día ya entran a tu local.</strong> No necesitas más clientes — necesitas que cada uno compre <strong>1 producto más</strong>.<br><br>
Si cada cliente agrega $1,500 a su compra actual de $2,832:<br>
• $1,500 × 250 = <strong>$375,000 adicionales por día</strong><br>
• = <strong>$11.25 millones adicionales por mes</strong><br><br>
<em>La forma más barata y rápida de crecer es <strong>vender más a quien ya te compra.</strong></em>
</div>

---

*Plan generado automáticamente por GestorPOS — Sistema de Punto de Venta Inteligente*
