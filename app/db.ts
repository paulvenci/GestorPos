import Dexie, { type Table } from 'dexie';

export interface ProductoLocal {
  id: string; // uuid
  empresa_id?: string;
  nombre: string;
  sku: string;
  precio: number;
  costo: number;
  stock: number;
  categoria: string | null;
  activo: boolean;
  imagen_url: string | null;
  es_pesable?: boolean;
  stock_minimo?: number;
  margen_ganancia?: number | null;
  updated_at: string;
}

export interface VentaOffline {
  id?: number; // Auto-incremented local id
  empresa_id?: string;
  turno_id: string;
  subtotal: number;
  total: number;
  metodo_pago?: string;
  detalles: any[]; // Se tipificará mejor más adelante
  sync_status: 'pending' | 'synced' | 'error';
  created_at: string;
}

export interface ItemCarritoLocal {
  id_producto: string;
  nombre: string;
  sku: string;
  precio: number;
  cantidad: number;
  descuento: number;
  es_pesable?: boolean;
}

export interface VentaReservadaLocal {
  id?: number;
  items: ItemCarritoLocal[];
  total: number;
  created_at: string;
}

export class GestorPOSDatabase extends Dexie {
  productos!: Table<ProductoLocal, string>;
  ventas_offline!: Table<VentaOffline, number>;
  ventas_reservadas!: Table<VentaReservadaLocal, number>;

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
    this.version(3).stores({
      productos: 'id, sku, nombre',
      ventas_offline: '++id, sync_status, created_at',
      ventas_reservadas: '++id'
    });
  }
}

export const db = new GestorPOSDatabase();
