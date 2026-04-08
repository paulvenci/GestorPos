# Módulo de Finanzas: Especificaciones Funcionales

## 1. Módulo de Control de Compras (Entrada de Stock)
No basta con registrar que "llegó mercancía"; el sistema debe capturar el costo para poder calcular la utilidad después.

*   **Registro de Facturas de Proveedores:** El usuario debe ingresar qué compró, a qué proveedor y a qué precio unitario.
*   **Actualización Automática de Inventario:** Al registrar la compra, el stock sube automáticamente.
*   **Costo Promedio Ponderado:** Esto es vital. Si hoy compras un producto a $10 y mañana a $12, el sistema debe calcular el costo medio para que el reporte de ganancias sea preciso.

## 2. Reporte de Utilidad Neta (Lo que se ganó)
Para entregar este reporte, tu sistema debe realizar una operación matemática simple pero constante por cada venta realizada:

$$ \text{Utilidad} = \text{Precio de Venta} - \text{Costo de Compra} $$

### ¿Qué debería incluir ese reporte mensual?
*   **Ventas Totales (Brutas):** Todo el dinero que entró.
*   **Costo de lo Vendido (COGS):** Cuánto le costó al dueño del negocio adquirir esos productos que vendió.
*   **Margen de Contribución:** La diferencia entre los dos anteriores.
*   **Gastos Operativos (Opcional pero recomendado):** Si permites registrar luz, renta o sueldos, el reporte dará la Utilidad Real.

### Ejemplo de Estructura - Tabla de Base de Datos
Para que tu reporte sea sólido, cada registro de "Venta" debería guardar una "fotografía" del costo en ese momento:

| ID Venta | Producto | Precio Venta | Costo (al momento) | Utilidad |
| :--- | :--- | :--- | :--- | :--- |
| 101 | Camisa | $25.00 | $12.00 | $13.00 |
| 102 | Pantalón | $40.00 | $18.00 | $22.00 |
| **TOTAL** | | **$65.00** | **$30.00** | **$35.00** |

## Ventaja Competitiva para GestorPOS
Si les dices que tu sistema no solo hace el ticket, sino que les dice "este mes te quedan $X libres de polvo y paja", les estás quitando un dolor de cabeza enorme. Los dueños de negocios odian contar facturas a fin de mes; si el POS lo hace solo, ya lo tienes vendido.