const ventasDia = document.getElementById('ventasDia');
const ticketPromedio = document.getElementById('ticketPromedio');
const porcentajeFuga = document.getElementById('porcentajeFuga');
const resultado = document.getElementById('resultadoCalculadora');

function formatCLP(value) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value);
}

function recalcular() {
  const ventas = Number(ventasDia?.value || 0);
  const ticket = Number(ticketPromedio?.value || 0);
  const fuga = Number(porcentajeFuga?.value || 0) / 100;
  const mensual = ventas * ticket * fuga * 30;
  if (resultado) resultado.textContent = formatCLP(mensual);
}

[ventasDia, ticketPromedio, porcentajeFuga].forEach((input) => {
  input?.addEventListener('input', recalcular);
});

recalcular();
