// Carbon Module Types

export type TruckType = 'leve' | 'medio' | 'pesado';

export type TripStatus = 'em_andamento' | 'concluida' | 'cancelada';

export type ReliabilityBadge = 'estimado' | 'calculado' | 'auditavel';

export interface CarbonTrip {
  id: string;
  origem: string;
  destino: string;
  distancia_km: number;
  peso_carga_tons: number;
  tipo_caminhao: TruckType;
  status: TripStatus;
  data_viagem: string;
  veiculo_placa?: string;
  motorista?: string;
  badge?: ReliabilityBadge;
  created_at: string;
  updated_at: string;
  // Diesel consumption fields
  consumo_litros?: number; // actual liters consumed (if known)
  media_km_por_litro?: number; // avg fuel efficiency (km/L)
}

export interface CarbonEmission {
  trip_id: string;
  consumo_litros: number;
  emissions_kg_co2: number;
  emissions_tco2e: number;
  trees_equivalent: number;
  offset_cost_brl: number;
}

export interface CarbonSettings {
  show_trees_equivalent: boolean;
  show_offset_cost: boolean;
  emission_factor_kg_per_liter: number; // kg CO2 per liter diesel (default 2.68)
  default_km_per_liter: number; // default fuel efficiency when not specified
}

export interface CarbonKPIs {
  total_emissions_tco2e: number;
  avg_emissions_per_trip: number;
  emissions_per_ton: number;
  trees_equivalent: number;
  offset_cost_brl: number;
  total_trips: number;
  total_distance_km: number;
  total_cargo_tons: number;
  total_diesel_liters: number;
}

export interface ScenarioComparison {
  origem: string;
  destino: string;
  distancia_atual_km: number;
  distancia_otimizada_km: number;
  peso_carga_tons: number;
  media_km_por_litro: number;
  emissions_atual: number;
  emissions_otimizada: number;
  emissions_evitadas: number;
  reducao_percentual: number;
  trees_equivalent: number;
  offset_cost_brl: number;
}

// Default carbon settings — fator brasileiro: 2,68 kg CO₂/litro diesel
export const DEFAULT_CARBON_SETTINGS: CarbonSettings = {
  show_trees_equivalent: true,
  show_offset_cost: true,
  emission_factor_kg_per_liter: 2.68,
  default_km_per_liter: 2.5, // média para carretas pesadas
};

/**
 * Calcula o consumo de diesel em litros.
 * Se consumo_litros já conhecido, retorna direto.
 * Senão calcula: distância / (km/L)
 */
export const calculateDieselConsumption = (
  distancia_km: number,
  consumo_litros?: number,
  media_km_por_litro: number = 2.5
): number => {
  if (consumo_litros && consumo_litros > 0) return consumo_litros;
  if (distancia_km <= 0 || media_km_por_litro <= 0) return 0;
  return distancia_km / media_km_por_litro;
};

/**
 * CO₂ emitido (kg) = litros de diesel × 2,68 kg/L
 */
export const calculateEmissionsKg = (
  litros: number,
  factor: number = 2.68
): number => {
  return litros * factor;
};

/**
 * Converte kg CO₂ para toneladas CO₂e
 */
export const calculateEmissionsTco2e = (emissionsKg: number): number => {
  return emissionsKg / 1000;
};

/**
 * 1 árvore absorve ~0,14 tCO₂e/ano
 */
export const calculateTreesEquivalent = (emissionsTco2e: number): number => {
  return emissionsTco2e / 0.14;
};

/**
 * Custo compensação: R$ 39 por árvore
 */
export const calculateOffsetCost = (treesEquivalent: number): number => {
  return treesEquivalent * 39;
};

// Legacy compatibility — TKU method (kept for comparator if needed)
export const calculateTKU = (cargoWeightTons: number, distanceKm: number): number => {
  return cargoWeightTons * distanceKm;
};

export const getTruckTypeLabel = (type: TruckType): string => {
  const labels: Record<TruckType, string> = {
    leve: 'Leve',
    medio: 'Médio',
    pesado: 'Pesado',
  };
  return labels[type];
};

export const getTripStatusLabel = (status: TripStatus): string => {
  const labels: Record<TripStatus, string> = {
    em_andamento: 'Em Andamento',
    concluida: 'Concluída',
    cancelada: 'Cancelada',
  };
  return labels[status];
};

export const getTripStatusColor = (status: TripStatus): string => {
  const colors: Record<TripStatus, string> = {
    em_andamento: 'bg-vs-warning/20 text-yellow-400',
    concluida: 'bg-vs-healthy/20 text-green-400',
    cancelada: 'bg-vs-critical/20 text-red-400',
  };
  return colors[status];
};

export const getBadgeLabel = (badge: ReliabilityBadge): string => {
  const labels: Record<ReliabilityBadge, string> = {
    estimado: 'Estimado',
    calculado: 'Calculado',
    auditavel: 'Auditável',
  };
  return labels[badge];
};

export const getBadgeColor = (badge: ReliabilityBadge): string => {
  const colors: Record<ReliabilityBadge, string> = {
    estimado: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    calculado: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    auditavel: 'bg-green-500/20 text-green-400 border-green-500/30',
  };
  return colors[badge];
};
