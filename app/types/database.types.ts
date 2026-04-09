export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ajustes_stock: {
        Row: {
          cantidad: number
          created_at: string | null
          empresa_id: string
          id: string
          id_producto: string
          id_usuario: string
          motivo: string
          observaciones: string | null
          stock_anterior: number
          stock_nuevo: number
          tipo: string
        }
        Insert: {
          cantidad: number
          created_at?: string | null
          empresa_id?: string
          id?: string
          id_producto: string
          id_usuario: string
          motivo: string
          observaciones?: string | null
          stock_anterior: number
          stock_nuevo: number
          tipo: string
        }
        Update: {
          cantidad?: number
          created_at?: string | null
          empresa_id?: string
          id?: string
          id_producto?: string
          id_usuario?: string
          motivo?: string
          observaciones?: string | null
          stock_anterior?: number
          stock_nuevo?: number
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "ajustes_stock_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ajustes_stock_id_producto_fkey"
            columns: ["id_producto"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias: {
        Row: {
          activo: boolean | null
          color: string | null
          created_at: string | null
          descripcion: string | null
          empresa_id: string
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean | null
          color?: string | null
          created_at?: string | null
          descripcion?: string | null
          empresa_id?: string
          id?: string
          nombre: string
        }
        Update: {
          activo?: boolean | null
          color?: string | null
          created_at?: string | null
          descripcion?: string | null
          empresa_id?: string
          id?: string
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "categorias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracion: {
        Row: {
          empresa_id: string
          id: string
          margen_ganancia_defecto: number | null
          role_permissions: Json | null
          stock_minimo_defecto: number | null
          updated_at: string | null
        }
        Insert: {
          empresa_id?: string
          id?: string
          margen_ganancia_defecto?: number | null
          role_permissions?: Json | null
          stock_minimo_defecto?: number | null
          updated_at?: string | null
        }
        Update: {
          empresa_id?: string
          id?: string
          margen_ganancia_defecto?: number | null
          role_permissions?: Json | null
          stock_minimo_defecto?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "configuracion_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          activo: boolean
          created_at: string
          fecha_vencimiento: string | null
          id: string
          nombre: string
          plan: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          fecha_vencimiento?: string | null
          id?: string
          nombre: string
          plan?: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          fecha_vencimiento?: string | null
          id?: string
          nombre?: string
          plan?: string
          updated_at?: string
        }
        Relationships: []
      }
      detalle_ventas: {
        Row: {
          cantidad: number
          created_at: string | null
          empresa_id: string
          id: string
          id_producto: string
          id_venta: string
          precio_unitario: number
          subtotal: number
        }
        Insert: {
          cantidad: number
          created_at?: string | null
          empresa_id?: string
          id?: string
          id_producto: string
          id_venta: string
          precio_unitario: number
          subtotal: number
        }
        Update: {
          cantidad?: number
          created_at?: string | null
          empresa_id?: string
          id?: string
          id_producto?: string
          id_venta?: string
          precio_unitario?: number
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "detalle_ventas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detalle_ventas_id_producto_fkey"
            columns: ["id_producto"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detalle_ventas_id_venta_fkey"
            columns: ["id_venta"]
            isOneToOne: false
            referencedRelation: "ventas"
            referencedColumns: ["id"]
          },
        ]
      }
      perfiles: {
        Row: {
          activo: boolean | null
          created_at: string | null
          empresa_id: string
          id: string
          nombre: string | null
          rol: string
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          empresa_id: string
          id: string
          nombre?: string | null
          rol?: string
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          empresa_id?: string
          id?: string
          nombre?: string | null
          rol?: string
        }
        Relationships: [
          {
            foreignKeyName: "perfiles_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      productos: {
        Row: {
          activo: boolean | null
          categoria: string | null
          costo: number | null
          created_at: string | null
          empresa_id: string
          id: string
          imagen_url: string | null
          nombre: string
          precio: number
          sku: string | null
          stock: number
          updated_at: string | null
          es_pesable: boolean | null
          stock_minimo: number | null
          margen_ganancia: number | null
        }
        Insert: {
          activo?: boolean | null
          categoria?: string | null
          costo?: number | null
          created_at?: string | null
          empresa_id?: string
          id?: string
          imagen_url?: string | null
          nombre: string
          precio?: number
          sku?: string | null
          stock?: number
          updated_at?: string | null
          es_pesable?: boolean | null
          stock_minimo?: number | null
          margen_ganancia?: number | null
        }
        Update: {
          activo?: boolean | null
          categoria?: string | null
          costo?: number | null
          created_at?: string | null
          empresa_id?: string
          id?: string
          imagen_url?: string | null
          nombre?: string
          precio?: number
          sku?: string | null
          stock?: number
          updated_at?: string | null
          es_pesable?: boolean | null
          stock_minimo?: number | null
          margen_ganancia?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "productos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      turnos_caja: {
        Row: {
          created_at: string | null
          empresa_id: string
          estado: string
          fecha_apertura: string
          fecha_cierre: string | null
          id: string
          id_usuario: string
          monto_declarado: number | null
          monto_inicial: number
          observaciones: string | null
          ventas_registradas: number | null
        }
        Insert: {
          created_at?: string | null
          empresa_id?: string
          estado?: string
          fecha_apertura?: string
          fecha_cierre?: string | null
          id?: string
          id_usuario: string
          monto_declarado?: number | null
          monto_inicial?: number
          observaciones?: string | null
          ventas_registradas?: number | null
        }
        Update: {
          created_at?: string | null
          empresa_id?: string
          estado?: string
          fecha_apertura?: string
          fecha_cierre?: string | null
          id?: string
          id_usuario?: string
          monto_declarado?: number | null
          monto_inicial?: number
          observaciones?: string | null
          ventas_registradas?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "turnos_caja_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      ventas: {
        Row: {
          created_at: string | null
          descuentos: number | null
          empresa_id: string
          fecha: string
          id: string
          id_turno: string | null
          id_usuario: string | null
          impuestos: number | null
          metodo_pago: string
          subtotal: number
          total: number
        }
        Insert: {
          created_at?: string | null
          descuentos?: number | null
          empresa_id?: string
          fecha?: string
          id?: string
          id_turno?: string | null
          id_usuario?: string | null
          impuestos?: number | null
          metodo_pago?: string
          subtotal?: number
          total: number
        }
        Update: {
          created_at?: string | null
          descuentos?: number | null
          empresa_id?: string
          fecha?: string
          id?: string
          id_turno?: string | null
          id_usuario?: string | null
          impuestos?: number | null
          metodo_pago?: string
          subtotal?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "ventas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventas_id_turno_fkey"
            columns: ["id_turno"]
            isOneToOne: false
            referencedRelation: "turnos_caja"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_productos_sin_rotacion: {
        Args: { dias_historial?: number }
        Returns: {
          nombre: string
          precio: number
          producto_id: string
          stock: number
        }[]
      }
      get_rentabilidad: {
        Args: { dias_historial?: number }
        Returns: {
          margen_porcentaje: number
          total_costos: number
          total_ventas: number
          utilidad_bruta: number
        }[]
      }
      get_top_productos: {
        Args: { dias_historial?: number }
        Returns: {
          nombre: string
          producto_id: string
          total_cantidad: number
          total_ingreso: number
        }[]
      }
      registrar_venta:
        | {
            Args: {
              p_descuentos?: number
              p_id_turno?: string
              p_id_usuario?: string
              p_impuestos?: number
              p_items?: Json
              p_metodo_pago?: string
              p_subtotal?: number
              p_total?: number
            }
            Returns: string
          }
        | {
            Args: {
              p_descuentos: number
              p_id_turno: string
              p_impuestos: number
              p_items: Json
              p_metodo_pago: string
              p_subtotal: number
              p_total: number
            }
            Returns: string
          }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
