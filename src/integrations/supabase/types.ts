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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      trip_beacons: {
        Row: {
          created_at: string
          device_code: string
          device_name: string | null
          id: string
          trip_id: string
        }
        Insert: {
          created_at?: string
          device_code: string
          device_name?: string | null
          id?: string
          trip_id: string
        }
        Update: {
          created_at?: string
          device_code?: string
          device_name?: string | null
          id?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_beacons_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_events: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          tipo: string
          trip_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          tipo: string
          trip_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          tipo?: string
          trip_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_events_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          caminhao: string
          checklist_carga_conferida: boolean | null
          checklist_refrigeracao_verificada: boolean | null
          checklist_rota_carregada: boolean | null
          checklist_sensores_instalados: boolean | null
          checklist_sistema_ligado: boolean | null
          created_at: string
          data_saida: string | null
          destino: string
          gestor_id: string | null
          id: string
          motorista_id: string
          origem: string
          peso_carga: number | null
          previsao_chegada: string | null
          quality_score: number | null
          sensor_config: Json | null
          status: string
          tipo_carga: string | null
          trip_code: string | null
          updated_at: string
        }
        Insert: {
          caminhao?: string
          checklist_carga_conferida?: boolean | null
          checklist_refrigeracao_verificada?: boolean | null
          checklist_rota_carregada?: boolean | null
          checklist_sensores_instalados?: boolean | null
          checklist_sistema_ligado?: boolean | null
          created_at?: string
          data_saida?: string | null
          destino?: string
          gestor_id?: string | null
          id?: string
          motorista_id: string
          origem?: string
          peso_carga?: number | null
          previsao_chegada?: string | null
          quality_score?: number | null
          sensor_config?: Json | null
          status?: string
          tipo_carga?: string | null
          trip_code?: string | null
          updated_at?: string
        }
        Update: {
          caminhao?: string
          checklist_carga_conferida?: boolean | null
          checklist_refrigeracao_verificada?: boolean | null
          checklist_rota_carregada?: boolean | null
          checklist_sensores_instalados?: boolean | null
          checklist_sistema_ligado?: boolean | null
          created_at?: string
          data_saida?: string | null
          destino?: string
          gestor_id?: string | null
          id?: string
          motorista_id?: string
          origem?: string
          peso_carga?: number | null
          previsao_chegada?: string | null
          quality_score?: number | null
          sensor_config?: Json | null
          status?: string
          tipo_carga?: string | null
          trip_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_devices: {
        Row: {
          device_code: string
          device_name: string | null
          id: string
          linked_at: string
          user_id: string
        }
        Insert: {
          device_code: string
          device_name?: string | null
          id?: string
          linked_at?: string
          user_id: string
        }
        Update: {
          device_code?: string
          device_name?: string | null
          id?: string
          linked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      users_profile: {
        Row: {
          created_at: string
          id: string
          nome: string
          tipo: Database["public"]["Enums"]["user_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          nome: string
          tipo: Database["public"]["Enums"]["user_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          tipo?: Database["public"]["Enums"]["user_type"]
          updated_at?: string
        }
        Relationships: []
      }
      viniferasense_data: {
        Row: {
          carga: string | null
          co2: number
          created_at: string
          estagio: string
          id: string
          indice_cor: number
          latitude: number | null
          longitude: number | null
          respiracao: number
          rota: string | null
          temperatura: number
          umidade: number
          veiculo: string | null
          vibracao: string
        }
        Insert: {
          carga?: string | null
          co2: number
          created_at?: string
          estagio: string
          id?: string
          indice_cor: number
          latitude?: number | null
          longitude?: number | null
          respiracao: number
          rota?: string | null
          temperatura: number
          umidade: number
          veiculo?: string | null
          vibracao: string
        }
        Update: {
          carga?: string | null
          co2?: number
          created_at?: string
          estagio?: string
          id?: string
          indice_cor?: number
          latitude?: number | null
          longitude?: number | null
          respiracao?: number
          rota?: string | null
          temperatura?: number
          umidade?: number
          veiculo?: string | null
          vibracao?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_type: "motorista" | "gestor" | "autonomo"
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
    Enums: {
      user_type: ["motorista", "gestor", "autonomo"],
    },
  },
} as const
