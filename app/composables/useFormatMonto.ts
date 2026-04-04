/**
 * Composable para formateo de moneda CLP (sin decimales)
 * Centraliza el formato de montos en toda la aplicación
 */
export function useFormatMonto() {
  const formatter = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })

  function formatMonto(n: number | null | undefined): string {
    return formatter.format(n ?? 0)
  }

  function formatFecha(iso: string): string {
    return new Date(iso).toLocaleString('es-CL', {
      dateStyle: 'short',
      timeStyle: 'short'
    })
  }

  function formatFechaLarga(iso: string): string {
    return new Date(iso).toLocaleString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return { formatMonto, formatFecha, formatFechaLarga }
}
