import Dexie, { type Table } from 'dexie';

export interface ProductoLocal {
  id: string; // uuid
  nombre: string;
  sku: string;
  precio: number;
  costo: number;
  stock: number;
  categoria: string | null;
  activo: boolean;
  imagen_url: string | null;
  updated_at: string;
}

export interface VentaOffline {
  id?: number; // Auto-incremented local id
  turno_id: string;
  subtotal: number;
  total: number;
  detalles: any[]; // Se tipificará mejor más adelante
  sync_status: 'pending' | 'synced' | 'error';
  created_at: string;
}

export class GestorPOSDatabase extends Dexie {
  productos!: Table<ProductoLocal, string>;
  ventas_offline!: Table<VentaOffline, number>;

  constructor() {
    super('GestorPOSDatabase');
    this.version(1).stores({
      productos: 'id, sku, nombre',
      ventas_offline: '++id, sync_status, created_at'
    });
    this.version(2).stores({
      productos: 'id, sku, nombre',
      ventas_offline: '++id, sync_status, created_at'
    });
  }
}

export const db = new GestorPOSDatabase();
