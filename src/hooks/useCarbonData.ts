import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  CarbonTrip,
  CarbonKPIs,
  CarbonSettings,
  DEFAULT_CARBON_SETTINGS,
  calculateDieselConsumption,
  calculateEmissionsKg,
  calculateEmissionsTco2e,
  calculateTreesEquivalent,
  calculateOffsetCost,
  TripStatus,
} from '@/types/carbon';

// Maps a database trip row to a CarbonTrip
const mapTripToCarbonTrip = (row: any): CarbonTrip => {
  const statusMap: Record<string, TripStatus> = {
    'em_andamento': 'em_andamento',
    'concluida': 'concluida',
    'cancelada': 'cancelada',
  };

  return {
    id: row.id,
    origem: row.origem || '',
    destino: row.destino || '',
    distancia_km: 0, // Will be calculated when route data is available
    peso_carga_tons: (row.peso_carga || 0) / 1000,
    tipo_caminhao: 'medio' as const,
    status: statusMap[row.status] || 'em_andamento',
    data_viagem: row.data_saida || row.created_at,
    veiculo_placa: row.caminhao || undefined,
    motorista: undefined,
    badge: 'estimado' as const,
    created_at: row.created_at,
    updated_at: row.updated_at,
    consumo_litros: undefined,
    media_km_por_litro: undefined,
  };
};

interface UseCarbonDataReturn {
  trips: CarbonTrip[];
  loading: boolean;
  error: string | null;
  settings: CarbonSettings;
  kpis: CarbonKPIs;
  filteredTrips: CarbonTrip[];
  updateSettings: (settings: Partial<CarbonSettings>) => void;
  setDateRange: (start: Date | null, end: Date | null) => void;
  setTruckFilter: (truck: string | null) => void;
  setStatusFilter: (status: TripStatus | null) => void;
  calculateTripEmissions: (trip: CarbonTrip) => {
    consumo_litros: number;
    emissions_kg_co2: number;
    emissions_tco2e: number;
    trees_equivalent: number;
    offset_cost_brl: number;
  };
  getEmissionsOverTime: () => { date: string; emissions: number }[];
  getEmissionsByTruck: () => { truck: string; emissions: number }[];
  refresh: () => void;
}

export const useCarbonData = (): UseCarbonDataReturn => {
  const [trips, setTrips] = useState<CarbonTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<CarbonSettings>(DEFAULT_CARBON_SETTINGS);
  
  // Filters
  const [dateStart, setDateStart] = useState<Date | null>(null);
  const [dateEnd, setDateEnd] = useState<Date | null>(null);
  const [truckFilter, setTruckFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<TripStatus | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: tripsData, error: fetchError } = await supabase
        .from('trips')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        setError('Erro ao carregar dados de viagens');
        console.error('Carbon data fetch error:', fetchError);
      } else {
        const carbonTrips = (tripsData || []).map(mapTripToCarbonTrip);
        setTrips(carbonTrips);
      }
    } catch (err) {
      setError('Erro ao carregar dados de carbono');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const calculateTripEmissions = useCallback((trip: CarbonTrip) => {
    const consumo_litros = calculateDieselConsumption(
      trip.distancia_km,
      trip.consumo_litros,
      trip.media_km_por_litro || settings.default_km_per_liter
    );
    const emissions_kg_co2 = calculateEmissionsKg(consumo_litros, settings.emission_factor_kg_per_liter);
    const emissions_tco2e = calculateEmissionsTco2e(emissions_kg_co2);
    const trees_equivalent = calculateTreesEquivalent(emissions_tco2e);
    const offset_cost_brl = calculateOffsetCost(trees_equivalent);

    return {
      consumo_litros,
      emissions_kg_co2,
      emissions_tco2e,
      trees_equivalent,
      offset_cost_brl,
    };
  }, [settings.emission_factor_kg_per_liter, settings.default_km_per_liter]);

  const filteredTrips = useMemo(() => {
    return trips.filter(trip => {
      const tripDate = new Date(trip.data_viagem);
      
      if (dateStart && tripDate < dateStart) return false;
      if (dateEnd && tripDate > dateEnd) return false;
      if (truckFilter && trip.veiculo_placa !== truckFilter) return false;
      if (statusFilter && trip.status !== statusFilter) return false;
      
      return true;
    });
  }, [trips, dateStart, dateEnd, truckFilter, statusFilter]);

  const kpis = useMemo((): CarbonKPIs => {
    if (filteredTrips.length === 0) {
      return {
        total_emissions_tco2e: 0,
        avg_emissions_per_trip: 0,
        emissions_per_ton: 0,
        trees_equivalent: 0,
        offset_cost_brl: 0,
        total_trips: 0,
        total_distance_km: 0,
        total_cargo_tons: 0,
        total_diesel_liters: 0,
      };
    }

    let totalEmissions = 0;
    let totalDistance = 0;
    let totalCargo = 0;
    let totalDiesel = 0;

    filteredTrips.forEach(trip => {
      const result = calculateTripEmissions(trip);
      totalEmissions += result.emissions_tco2e;
      totalDistance += trip.distancia_km;
      totalCargo += trip.peso_carga_tons;
      totalDiesel += result.consumo_litros;
    });

    const treesEquivalent = calculateTreesEquivalent(totalEmissions);

    return {
      total_emissions_tco2e: totalEmissions,
      avg_emissions_per_trip: totalEmissions / filteredTrips.length,
      emissions_per_ton: totalCargo > 0 ? totalEmissions / totalCargo : 0,
      trees_equivalent: treesEquivalent,
      offset_cost_brl: calculateOffsetCost(treesEquivalent),
      total_trips: filteredTrips.length,
      total_distance_km: totalDistance,
      total_cargo_tons: totalCargo,
      total_diesel_liters: totalDiesel,
    };
  }, [filteredTrips, calculateTripEmissions]);

  const getEmissionsOverTime = useCallback(() => {
    const emissionsByDate: Record<string, number> = {};

    filteredTrips.forEach(trip => {
      const date = new Date(trip.data_viagem).toLocaleDateString('pt-BR');
      const { emissions_tco2e } = calculateTripEmissions(trip);
      emissionsByDate[date] = (emissionsByDate[date] || 0) + emissions_tco2e;
    });

    return Object.entries(emissionsByDate)
      .map(([date, emissions]) => ({ date, emissions }))
      .sort((a, b) => {
        const [dayA, monthA, yearA] = a.date.split('/').map(Number);
        const [dayB, monthB, yearB] = b.date.split('/').map(Number);
        return new Date(yearA, monthA - 1, dayA).getTime() - new Date(yearB, monthB - 1, dayB).getTime();
      });
  }, [filteredTrips, calculateTripEmissions]);

  const getEmissionsByTruck = useCallback(() => {
    const emissionsByTruck: Record<string, number> = {};

    filteredTrips.forEach(trip => {
      const truck = trip.veiculo_placa || 'Sem placa';
      const { emissions_tco2e } = calculateTripEmissions(trip);
      emissionsByTruck[truck] = (emissionsByTruck[truck] || 0) + emissions_tco2e;
    });

    return Object.entries(emissionsByTruck)
      .map(([truck, emissions]) => ({ truck, emissions }))
      .sort((a, b) => b.emissions - a.emissions);
  }, [filteredTrips, calculateTripEmissions]);

  const updateSettings = useCallback((newSettings: Partial<CarbonSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const setDateRange = useCallback((start: Date | null, end: Date | null) => {
    setDateStart(start);
    setDateEnd(end);
  }, []);

  return {
    trips,
    loading,
    error,
    settings,
    kpis,
    filteredTrips,
    updateSettings,
    setDateRange,
    setTruckFilter,
    setStatusFilter,
    calculateTripEmissions,
    getEmissionsOverTime,
    getEmissionsByTruck,
    refresh: loadData,
  };
};
