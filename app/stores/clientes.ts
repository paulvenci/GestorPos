import { defineStore } from 'pinia'
import type { Database } from '~/types/database.types'

export interface Cliente {
  id: string
  empresa_id?: string
  nombre: string
  telefono?: string
  rut?: string
  email?: string
  direccion?: string
  saldo_pendiente: number
  limite_credito?: number | null
  activo: boolean
  created_at?: string
  updated_at?: string
}

export interface VentaCredito {
  id: string
  id_venta: string
  id_cliente: string
  monto_total: number
  monto_pagado: number
  estado: 'pendiente' | 'parcial' | 'pagado'
  fecha_vencimiento?: string | null
  created_at: string
  // Joins
  ventas?: { id: string; fecha: string; total: number; metodo_pago: string }
}

export interface AbonoCredito {
  id: string
  id_venta_credito: string
  id_usuario?: string
  monto: number
  metodo_pago: string
  observaciones?: string
  fecha: string
}

export const useClientesStore = defineStore('clientes', () => {
  const supabase = useSupabaseClient<Database>()

  const clientes = ref<Cliente[]>([])
  const loading = ref(false)

  // ─── CRUD Clientes ──────────────────────────────────
  async function fetchClientes() {
    loading.value = true
    try {
      const { data, error } = await (supabase.from('clientes') as any)
        .select('*')
        .order('nombre')
      if (error) throw error
      clientes.value = data || []
    } finally {
      loading.value = false
    }
  }

  async function saveCliente(cliente: Partial<Cliente>): Promise<Cliente> {
    if (cliente.id) {
      // Update
      const { data, error } = await (supabase.from('clientes') as any)
        .update({
          nombre: cliente.nombre,
          telefono: cliente.telefono || null,
          rut: cliente.rut || null,
          email: cliente.email || null,
          direccion: cliente.direccion || null,
          limite_credito: cliente.limite_credito ?? null,
          activo: cliente.activo ?? true,
          updated_at: new Date().toISOString()
        })
        .eq('id', cliente.id)
        .select()
        .single()
      if (error) throw error
      await fetchClientes()
      return data
    } else {
      // Insert
      const { data, error } = await (supabase.from('clientes') as any)
        .insert({
          nombre: cliente.nombre,
          telefono: cliente.telefono || null,
          rut: cliente.rut || null,
          email: cliente.email || null,
          direccion: cliente.direccion || null,
          limite_credito: cliente.limite_credito ?? null,
          saldo_pendiente: 0,
          activo: true
        })
        .select()
        .single()
      if (error) throw error
      await fetchClientes()
      return data
    }
  }

  async function toggleActivo(id: string, activo: boolean) {
    const { error } = await (supabase.from('clientes') as any)
      .update({ activo, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
    await fetchClientes()
  }

  // ─── Búsqueda para Autocomplete ────────────────────
  async function buscarClientes(query: string): Promise<Cliente[]> {
    const q = query.toLowerCase().trim()
    if (!q) return clientes.value.filter(c => c.activo)
    return clientes.value.filter(c =>
      c.activo && (
        c.nombre.toLowerCase().includes(q) ||
        c.telefono?.toLowerCase().includes(q) ||
        c.rut?.toLowerCase().includes(q)
      )
    )
  }

  // ─── Deudas de un Cliente ──────────────────────────
  async function fetchDeudas(clienteId: string): Promise<VentaCredito[]> {
    const { data, error } = await (supabase.from('ventas_credito') as any)
      .select('*, ventas(id, fecha, total, metodo_pago)')
      .eq('id_cliente', clienteId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  }

  // ─── Abonos de un Crédito ─────────────────────────
  async function fetchAbonos(ventaCreditoId: string): Promise<AbonoCredito[]> {
    const { data, error } = await (supabase.from('abonos_credito') as any)
      .select('*')
      .eq('id_venta_credito', ventaCreditoId)
      .order('fecha', { ascending: false })
    if (error) throw error
    return data || []
  }

  // ─── Registrar Abono ──────────────────────────────
  async function registrarAbono(
    idVentaCredito: string,
    monto: number,
    metodoPago: string = 'transferencia',
    observaciones: string = ''
  ) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await (supabase.rpc as any)('registrar_abono_credito', {
      p_id_venta_credito: idVentaCredito,
      p_monto: monto,
      p_metodo_pago: metodoPago,
      p_observaciones: observaciones || null,
      p_id_usuario: user?.id ?? null
    })
    if (error) throw error
    await fetchClientes() // Refresh saldos
    return data
  }

  // ─── Crear Venta a Crédito ────────────────────────
  async function crearVentaCredito(
    idVenta: string,
    idCliente: string,
    montoTotal: number,
    fechaVencimiento?: string | null
  ) {
    // Insertar ventas_credito
    const { error: errCredito } = await (supabase.from('ventas_credito') as any)
      .insert({
        id_venta: idVenta,
        id_cliente: idCliente,
        monto_total: montoTotal,
        monto_pagado: 0,
        estado: 'pendiente',
        fecha_vencimiento: fechaVencimiento || null
      })
    if (errCredito) throw errCredito

    // Incrementar saldo_pendiente del cliente con RPC atómico
    const { error: errRpc } = await (supabase.rpc as any)('incrementar_saldo_cliente', {
      p_cliente_id: idCliente,
      p_monto: montoTotal
    })

    if (errRpc) {
      // Fallback: si el RPC falla, hacer update manual
      const cliente = clientes.value.find(c => c.id === idCliente)
      await (supabase.from('clientes') as any)
        .update({
          saldo_pendiente: (cliente?.saldo_pendiente || 0) + montoTotal,
          updated_at: new Date().toISOString()
        })
        .eq('id', idCliente)
    }

    await fetchClientes()
  }

  return {
    clientes, loading,
    fetchClientes, saveCliente, toggleActivo, buscarClientes,
    fetchDeudas, fetchAbonos, registrarAbono, crearVentaCredito
  }
})
