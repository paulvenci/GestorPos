// Script de análisis de ventas - GestorPOS
// Extrae datos de Supabase para análisis de negocio
// MODO DE USO SEGURO:
// node --env-file=.env scratch/analisis_ventas.mjs

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ ERROR: Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_KEY');
  console.log('Asegúrate de ejecutar el script con: node --env-file=.env scratch/analisis_ventas.mjs');
  process.exit(1);
}

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

async function query(table, params = '') {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${params}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    console.error(`Error querying ${table}:`, res.status, await res.text());
    return [];
  }
  return res.json();
}

async function rpc(fnName, body = {}) {
  const url = `${SUPABASE_URL}/rest/v1/rpc/${fnName}`;
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!res.ok) {
    console.error(`Error RPC ${fnName}:`, res.status, await res.text());
    return [];
  }
  return res.json();
}

async function main() {
  console.log('='.repeat(80));
  console.log('  ANÁLISIS COMPLETO DE VENTAS - PANADERÍA Y MINIMARKET');
  console.log('='.repeat(80));
  console.log();

  // 1. PRODUCTOS
  const productos = await query('productos', 'select=*&activo=eq.true&order=nombre.asc&limit=1000');
  console.log(`📦 TOTAL PRODUCTOS ACTIVOS: ${productos.length}`);
  
  // Categorías
  const categorias = {};
  productos.forEach(p => {
    const cat = p.categoria || 'Sin categoría';
    if (!categorias[cat]) categorias[cat] = { count: 0, stockValue: 0, productos: [] };
    categorias[cat].count++;
    categorias[cat].stockValue += (p.stock || 0) * (p.costo || 0);
    categorias[cat].productos.push(p);
  });
  
  console.log('\n📊 DISTRIBUCIÓN POR CATEGORÍA:');
  Object.entries(categorias).sort((a, b) => b[1].count - a[1].count).forEach(([cat, data]) => {
    console.log(`  ${cat}: ${data.count} productos | Stock valorizado: $${data.stockValue.toFixed(0)}`);
  });

  // Productos sin stock
  const sinStock = productos.filter(p => p.stock <= 0);
  console.log(`\n⚠️  PRODUCTOS SIN STOCK: ${sinStock.length}`);
  sinStock.slice(0, 15).forEach(p => console.log(`  - ${p.nombre} (${p.categoria || 'S/C'}) precio: $${p.precio}`));

  // Productos con stock muy bajo (1-3 unidades)
  const stockBajo = productos.filter(p => p.stock > 0 && p.stock <= 3);
  console.log(`\n🔶 PRODUCTOS CON STOCK BAJO (1-3): ${stockBajo.length}`);
  stockBajo.slice(0, 15).forEach(p => console.log(`  - ${p.nombre}: ${p.stock} uds (${p.categoria || 'S/C'})`));

  // 2. VENTAS - Obtener todas
  const ventas = await query('ventas', 'select=*&order=fecha.desc&limit=10000');
  console.log(`\n${'='.repeat(80)}`);
  console.log(`💰 TOTAL VENTAS REGISTRADAS: ${ventas.length}`);
  
  if (ventas.length === 0) {
    console.log('No hay ventas registradas. Fin del análisis.');
    return;
  }

  // Rango de fechas
  const fechas = ventas.map(v => new Date(v.fecha));
  const primeraVenta = new Date(Math.min(...fechas));
  const ultimaVenta = new Date(Math.max(...fechas));
  console.log(`📅 Período: ${primeraVenta.toLocaleDateString('es-CL')} → ${ultimaVenta.toLocaleDateString('es-CL')}`);
  
  const diasOperacion = Math.ceil((ultimaVenta - primeraVenta) / (1000 * 60 * 60 * 24)) || 1;
  console.log(`📅 Días de operación: ${diasOperacion}`);

  // Totales
  const totalVentas = ventas.reduce((s, v) => s + parseFloat(v.total || 0), 0);
  const ticketPromedio = totalVentas / ventas.length;
  const ventasDiarias = totalVentas / diasOperacion;
  const transaccionesPorDia = ventas.length / diasOperacion;
  
  console.log(`\n💵 RESUMEN FINANCIERO:`);
  console.log(`  Total facturado: $${totalVentas.toLocaleString('es-CL', {maximumFractionDigits: 0})}`);
  console.log(`  Ticket promedio: $${ticketPromedio.toFixed(0)}`);
  console.log(`  Ventas diarias promedio: $${ventasDiarias.toFixed(0)}`);
  console.log(`  Transacciones por día: ${transaccionesPorDia.toFixed(1)}`);

  // 3. MÉTODOS DE PAGO
  const metodosPago = {};
  ventas.forEach(v => {
    const m = v.metodo_pago || 'desconocido';
    if (!metodosPago[m]) metodosPago[m] = { count: 0, total: 0 };
    metodosPago[m].count++;
    metodosPago[m].total += parseFloat(v.total || 0);
  });
  
  console.log(`\n💳 MÉTODOS DE PAGO:`);
  Object.entries(metodosPago).sort((a, b) => b[1].total - a[1].total).forEach(([m, data]) => {
    const pct = ((data.total / totalVentas) * 100).toFixed(1);
    console.log(`  ${m}: ${data.count} ventas ($${data.total.toFixed(0)}) → ${pct}%`);
  });

  // Desglose efectivo vs tarjeta vs transferencia
  const totalEfectivo = ventas.reduce((s, v) => s + parseFloat(v.pago_efectivo || 0), 0);
  const totalTarjeta = ventas.reduce((s, v) => s + parseFloat(v.pago_tarjeta || 0), 0);
  const totalTransferencia = ventas.reduce((s, v) => s + parseFloat(v.pago_transferencia || 0), 0);
  console.log(`\n  Desglose real de cobros:`);
  console.log(`    Efectivo: $${totalEfectivo.toFixed(0)} (${((totalEfectivo/totalVentas)*100).toFixed(1)}%)`);
  console.log(`    Tarjeta: $${totalTarjeta.toFixed(0)} (${((totalTarjeta/totalVentas)*100).toFixed(1)}%)`);
  console.log(`    Transferencia: $${totalTransferencia.toFixed(0)} (${((totalTransferencia/totalVentas)*100).toFixed(1)}%)`);

  // 4. ANÁLISIS POR DÍA DE LA SEMANA
  const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const ventasPorDiaSemana = {};
  diasSemana.forEach(d => ventasPorDiaSemana[d] = { count: 0, total: 0 });
  
  ventas.forEach(v => {
    const dia = diasSemana[new Date(v.fecha).getDay()];
    ventasPorDiaSemana[dia].count++;
    ventasPorDiaSemana[dia].total += parseFloat(v.total || 0);
  });
  
  console.log(`\n📆 VENTAS POR DÍA DE LA SEMANA:`);
  diasSemana.forEach(dia => {
    const d = ventasPorDiaSemana[dia];
    const bar = '█'.repeat(Math.round((d.total / Math.max(...Object.values(ventasPorDiaSemana).map(x => x.total))) * 30));
    console.log(`  ${dia.padEnd(12)} ${d.count.toString().padStart(4)} ventas | $${d.total.toFixed(0).padStart(10)} ${bar}`);
  });

  // 5. ANÁLISIS POR HORA
  const ventasPorHora = {};
  for (let h = 0; h < 24; h++) ventasPorHora[h] = { count: 0, total: 0 };
  
  ventas.forEach(v => {
    // Ajustar a hora Chile (UTC-4)
    const fecha = new Date(v.fecha);
    const hora = (fecha.getUTCHours() - 4 + 24) % 24;
    ventasPorHora[hora].count++;
    ventasPorHora[hora].total += parseFloat(v.total || 0);
  });
  
  console.log(`\n⏰ VENTAS POR HORA DEL DÍA (horario Chile):`);
  for (let h = 6; h <= 23; h++) {
    const d = ventasPorHora[h];
    if (d.count > 0) {
      const bar = '█'.repeat(Math.round((d.count / Math.max(...Object.values(ventasPorHora).map(x => x.count))) * 30));
      console.log(`  ${h.toString().padStart(2)}:00 ${d.count.toString().padStart(4)} ventas | $${d.total.toFixed(0).padStart(10)} ${bar}`);
    }
  }

  // 6. DETALLE DE VENTAS - Productos más vendidos
  const detalles = await query('detalle_ventas', 'select=*,productos(nombre,categoria,precio,costo)&limit=50000');
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧾 TOTAL LÍNEAS DE DETALLE: ${detalles.length}`);

  const productosVendidos = {};
  detalles.forEach(d => {
    const id = d.id_producto;
    const nombre = d.productos?.nombre || 'Desconocido';
    const cat = d.productos?.categoria || 'S/C';
    const costo = parseFloat(d.productos?.costo || 0);
    if (!productosVendidos[id]) productosVendidos[id] = { nombre, cat, cantidad: 0, ingreso: 0, costo: 0 };
    productosVendidos[id].cantidad += parseFloat(d.cantidad || 0);
    productosVendidos[id].ingreso += parseFloat(d.subtotal || 0);
    productosVendidos[id].costo += parseFloat(d.cantidad || 0) * costo;
  });

  // TOP 20 más vendidos por cantidad
  const topCantidad = Object.entries(productosVendidos).sort((a, b) => b[1].cantidad - a[1].cantidad);
  console.log(`\n🏆 TOP 20 PRODUCTOS MÁS VENDIDOS (por cantidad):`);
  topCantidad.slice(0, 20).forEach(([id, d], i) => {
    const margen = d.ingreso > 0 && d.costo > 0 ? (((d.ingreso - d.costo) / d.ingreso) * 100).toFixed(1) : 'N/A';
    console.log(`  ${(i+1).toString().padStart(2)}. ${d.nombre.padEnd(35).slice(0,35)} | ${d.cantidad.toString().padStart(6)} uds | $${d.ingreso.toFixed(0).padStart(8)} | Margen: ${margen}%`);
  });

  // TOP 20 por ingreso
  const topIngreso = Object.entries(productosVendidos).sort((a, b) => b[1].ingreso - a[1].ingreso);
  console.log(`\n💎 TOP 20 PRODUCTOS POR INGRESO GENERADO:`);
  topIngreso.slice(0, 20).forEach(([id, d], i) => {
    const margen = d.ingreso > 0 && d.costo > 0 ? (((d.ingreso - d.costo) / d.ingreso) * 100).toFixed(1) : 'N/A';
    console.log(`  ${(i+1).toString().padStart(2)}. ${d.nombre.padEnd(35).slice(0,35)} | $${d.ingreso.toFixed(0).padStart(8)} | ${d.cantidad.toString().padStart(6)} uds | Margen: ${margen}%`);
  });

  // TOP productos por margen
  const topMargen = Object.entries(productosVendidos)
    .filter(([, d]) => d.costo > 0 && d.cantidad >= 5)
    .map(([id, d]) => ({
      ...d,
      margen: ((d.ingreso - d.costo) / d.ingreso) * 100,
      utilidad: d.ingreso - d.costo
    }))
    .sort((a, b) => b.utilidad - a.utilidad);

  console.log(`\n💰 TOP 20 PRODUCTOS MÁS RENTABLES (utilidad bruta, mín 5 ventas):`);
  topMargen.slice(0, 20).forEach((d, i) => {
    console.log(`  ${(i+1).toString().padStart(2)}. ${d.nombre.padEnd(35).slice(0,35)} | Utilidad: $${d.utilidad.toFixed(0).padStart(7)} | Margen: ${d.margen.toFixed(1)}% | ${d.cantidad} uds`);
  });

  // Productos con peor margen
  const peorMargen = Object.entries(productosVendidos)
    .filter(([, d]) => d.costo > 0 && d.cantidad >= 3)
    .map(([id, d]) => ({
      ...d,
      margen: ((d.ingreso - d.costo) / d.ingreso) * 100,
      utilidad: d.ingreso - d.costo
    }))
    .sort((a, b) => a.margen - b.margen);

  console.log(`\n📉 TOP 10 PRODUCTOS CON PEOR MARGEN (mín 3 ventas):`);
  peorMargen.slice(0, 10).forEach((d, i) => {
    console.log(`  ${(i+1).toString().padStart(2)}. ${d.nombre.padEnd(35).slice(0,35)} | Margen: ${d.margen.toFixed(1)}% | Utilidad: $${d.utilidad.toFixed(0)} | ${d.cantidad} uds`);
  });

  // 7. ANÁLISIS POR CATEGORÍA
  const ventasPorCategoria = {};
  detalles.forEach(d => {
    const cat = d.productos?.categoria || 'Sin categoría';
    if (!ventasPorCategoria[cat]) ventasPorCategoria[cat] = { cantidad: 0, ingreso: 0, costo: 0, transacciones: new Set() };
    ventasPorCategoria[cat].cantidad += parseFloat(d.cantidad || 0);
    ventasPorCategoria[cat].ingreso += parseFloat(d.subtotal || 0);
    ventasPorCategoria[cat].costo += parseFloat(d.cantidad || 0) * parseFloat(d.productos?.costo || 0);
    ventasPorCategoria[cat].transacciones.add(d.id_venta);
  });

  console.log(`\n📂 VENTAS POR CATEGORÍA:`);
  Object.entries(ventasPorCategoria)
    .sort((a, b) => b[1].ingreso - a[1].ingreso)
    .forEach(([cat, d]) => {
      const margen = d.ingreso > 0 && d.costo > 0 ? (((d.ingreso - d.costo) / d.ingreso) * 100).toFixed(1) : 'N/A';
      const pct = ((d.ingreso / totalVentas) * 100).toFixed(1);
      console.log(`  ${cat.padEnd(25).slice(0,25)} | $${d.ingreso.toFixed(0).padStart(9)} (${pct}%) | ${d.cantidad.toString().padStart(6)} uds | Margen: ${margen}% | En ${d.transacciones.size} ventas`);
    });

  // 8. TENDENCIA SEMANAL
  const ventasPorSemana = {};
  ventas.forEach(v => {
    const fecha = new Date(v.fecha);
    const inicioSemana = new Date(fecha);
    inicioSemana.setDate(fecha.getDate() - fecha.getDay());
    const key = inicioSemana.toISOString().slice(0, 10);
    if (!ventasPorSemana[key]) ventasPorSemana[key] = { count: 0, total: 0 };
    ventasPorSemana[key].count++;
    ventasPorSemana[key].total += parseFloat(v.total || 0);
  });

  console.log(`\n📈 TENDENCIA SEMANAL:`);
  Object.entries(ventasPorSemana).sort().forEach(([semana, d]) => {
    const bar = '█'.repeat(Math.round((d.total / Math.max(...Object.values(ventasPorSemana).map(x => x.total))) * 40));
    console.log(`  Semana ${semana} | ${d.count.toString().padStart(4)} ventas | $${d.total.toFixed(0).padStart(10)} ${bar}`);
  });

  // 9. TENDENCIA DIARIA (últimos 14 días)
  const ventasPorDia = {};
  ventas.forEach(v => {
    const key = new Date(v.fecha).toISOString().slice(0, 10);
    if (!ventasPorDia[key]) ventasPorDia[key] = { count: 0, total: 0 };
    ventasPorDia[key].count++;
    ventasPorDia[key].total += parseFloat(v.total || 0);
  });

  const diasOrdenados = Object.entries(ventasPorDia).sort().slice(-14);
  console.log(`\n📊 ÚLTIMOS 14 DÍAS DE OPERACIÓN:`);
  diasOrdenados.forEach(([dia, d]) => {
    const nombreDia = diasSemana[new Date(dia).getDay()].slice(0, 3);
    const bar = '█'.repeat(Math.round((d.total / Math.max(...diasOrdenados.map(x => x[1].total))) * 30));
    console.log(`  ${dia} (${nombreDia}) | ${d.count.toString().padStart(3)} ventas | $${d.total.toFixed(0).padStart(9)} ${bar}`);
  });

  // 10. PRODUCTOS QUE SE VENDEN JUNTOS (análisis de canasta)
  // Agrupar detalles por venta
  const canastas = {};
  detalles.forEach(d => {
    if (!canastas[d.id_venta]) canastas[d.id_venta] = [];
    canastas[d.id_venta].push(d.productos?.nombre || d.id_producto);
  });

  const pares = {};
  Object.values(canastas).forEach(items => {
    if (items.length < 2) return;
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const par = [items[i], items[j]].sort().join(' + ');
        pares[par] = (pares[par] || 0) + 1;
      }
    }
  });

  const topPares = Object.entries(pares).sort((a, b) => b[1] - a[1]);
  console.log(`\n🛒 TOP 15 COMBINACIONES DE PRODUCTOS (CANASTA):`);
  topPares.slice(0, 15).forEach(([par, count], i) => {
    console.log(`  ${(i+1).toString().padStart(2)}. ${par} → ${count} veces`);
  });

  // 11. Tamaño promedio del carrito
  const tamanos = Object.values(canastas).map(c => c.length);
  const tamPromedio = tamanos.reduce((a, b) => a + b, 0) / tamanos.length;
  console.log(`\n🛒 TAMAÑO PROMEDIO DEL CARRITO: ${tamPromedio.toFixed(1)} productos por venta`);
  
  // Distribución de tamaño de carrito
  const distTamano = {};
  tamanos.forEach(t => { distTamano[t] = (distTamano[t] || 0) + 1; });
  console.log(`  Distribución:`);
  Object.entries(distTamano).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).slice(0, 10).forEach(([t, c]) => {
    console.log(`    ${t} productos: ${c} ventas (${((c/tamanos.length)*100).toFixed(1)}%)`);
  });

  // 12. CRÉDITOS / FIADO
  const creditos = await query('creditos', 'select=*&limit=5000');
  if (creditos.length > 0) {
    const creditosPendientes = creditos.filter(c => c.estado === 'pendiente');
    const totalCredPend = creditosPendientes.reduce((s, c) => s + parseFloat(c.monto || 0), 0);
    const totalPagados = creditos.filter(c => c.estado === 'pagado').reduce((s, c) => s + parseFloat(c.monto || 0), 0);
    console.log(`\n🏦 CRÉDITOS/FIADO:`);
    console.log(`  Total créditos: ${creditos.length}`);
    console.log(`  Pendientes: ${creditosPendientes.length} ($${totalCredPend.toFixed(0)})`);
    console.log(`  Pagados: $${totalPagados.toFixed(0)}`);
  }

  // 13. TURNOS
  const turnos = await query('turnos_caja', 'select=*&order=fecha_apertura.desc&limit=1000');
  if (turnos.length > 0) {
    console.log(`\n⏱️ TURNOS DE CAJA:`);
    console.log(`  Total turnos registrados: ${turnos.length}`);
    const turnosConVentas = turnos.filter(t => (t.ventas_registradas || 0) > 0);
    const ventasPorTurno = turnosConVentas.map(t => t.ventas_registradas || 0);
    const promVentasTurno = ventasPorTurno.reduce((a, b) => a + b, 0) / ventasPorTurno.length;
    console.log(`  Turnos con ventas: ${turnosConVentas.length}`);
    console.log(`  Promedio ventas por turno: ${promVentasTurno.toFixed(1)}`);
  }

  // RESUMEN FINAL
  console.log(`\n${'='.repeat(80)}`);
  console.log('  MÉTRICAS CLAVE PARA PLAN DE CRECIMIENTO');
  console.log('='.repeat(80));
  console.log(`  📊 Ventas totales del período: $${totalVentas.toLocaleString('es-CL', {maximumFractionDigits: 0})}`);
  console.log(`  📊 Ticket promedio: $${ticketPromedio.toFixed(0)}`);
  console.log(`  📊 Transacciones por día: ${transaccionesPorDia.toFixed(1)}`);
  console.log(`  📊 Venta diaria promedio: $${ventasDiarias.toFixed(0)}`);
  console.log(`  📊 Productos activos: ${productos.length}`);
  console.log(`  📊 Sin stock: ${sinStock.length}`);
  console.log(`  📊 Items por carrito: ${tamPromedio.toFixed(1)}`);
  console.log(`  📊 Productos vendidos únicos: ${Object.keys(productosVendidos).length} de ${productos.length}`);
  console.log(`  📊 Productos nunca vendidos: ${productos.length - Object.keys(productosVendidos).length}`);
}

main().catch(console.error);
