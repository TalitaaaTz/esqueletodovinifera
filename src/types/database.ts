export type UserType = 'motorista' | 'gestor' | 'autonomo';

export interface UserProfile {
  id: string;
  nome: string;
  tipo: UserType;
  created_at: string;
  updated_at: string;
}

export interface SensorData {
  id: string;
  temperatura: number;
  umidade: number;
  co2: number | null;
  respiracao: number | null;
  indice_cor: number | null;
  estagio: string | null;
  vibracao: string | null;
  latitude: number | null;
  longitude: number | null;
  rota: string | null;
  veiculo: string | null;
  carga: string | null;
  created_at: string;
  updated_at?: string | null;
  device_id: string | null;
  device_code?: string | null;
  status?: string | null;
  tvoc?: number | null;
  // Beacon data
  microclima2_temp: number | null;
  microclima2_umidade: number | null;
  temperatura_carga: number | null;
}

export type RiskLevel = 'baixo' | 'medio' | 'alto';

export type CargoStatus = 'saudavel' | 'atencao' | 'critico';
