import { useState, useEffect, useCallback, useRef } from 'react';
import { externalSupabase } from '@/lib/externalSupabase';
import { SensorData, RiskLevel, CargoStatus } from '@/types/database';
import { toast } from '@/hooks/use-toast';

const TEMP_MIN = 2;
const TEMP_MAX = 6;
const HUMIDITY_MIN = 80;
const HUMIDITY_MAX = 92;
const CO2_MAX = 450;

type RawSensorRow = Partial<Record<string, unknown>>;
type DeviceFilterColumn = 'device_code' | 'device_id';
type ResolvedDeviceFilter = {
  column: DeviceFilterColumn;
  candidate: string;
};

const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const toText = (value: unknown): string | null => {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
};

const normalizeDeviceCandidates = (deviceId?: string) => {
  if (!deviceId?.trim()) return [];

  const trimmed = deviceId.trim();
  const lower = trimmed.toLowerCase();
  const digitsOnly = lower.replace(/^beacon/i, '').replace(/\D/g, '');

  return Array.from(
    new Set(
      [trimmed, lower, digitsOnly, digitsOnly ? `beacon${digitsOnly}` : ''].filter(Boolean)
    )
  );
};

const normalizeSensorData = (row: RawSensorRow): SensorData | null => {
  const temperatura = toFiniteNumber(row.temperatura);
  const umidade = toFiniteNumber(row.umidade);

  if (temperatura === null || umidade === null) {
    return null;
  }

  return {
    id: toText(row.id) ?? 'latest-reading',
    temperatura,
    umidade,
    co2: toFiniteNumber(row.co2),
    respiracao: toFiniteNumber(row.respiracao),
    indice_cor: toFiniteNumber(row.indice_cor),
    estagio: toText(row.estagio),
    vibracao: toText(row.vibracao),
    latitude: toFiniteNumber(row.latitude),
    longitude: toFiniteNumber(row.longitude),
    rota: toText(row.rota),
    veiculo: toText(row.veiculo),
    carga: toText(row.carga),
    created_at: toText(row.created_at) ?? new Date().toISOString(),
    updated_at: toText(row.updated_at),
    device_id: toText(row.device_id) ?? toText(row.device_code),
    device_code: toText(row.device_code) ?? toText(row.device_id),
    status: toText(row.status),
    tvoc: toFiniteNumber(row.tvoc),
    microclima2_temp: toFiniteNumber(row.microclima2_temp),
    microclima2_umidade: toFiniteNumber(row.microclima2_umidade),
    temperatura_carga: toFiniteNumber(row.temperatura_carga),
  };
};

const looksLikeMissingColumnError = (message: string, column: DeviceFilterColumn) => {
  const normalized = message.toLowerCase();
  return normalized.includes(column.toLowerCase()) && normalized.includes('column');
};

export const useSensorData = (deviceId?: string) => {
  const [data, setData] = useState<SensorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const resolvedFilterRef = useRef<ResolvedDeviceFilter | null>(null);
  const lastAlertRef = useRef<{ temp: boolean; humidity: boolean; co2: boolean }>({
    temp: false,
    humidity: false,
    co2: false,
  });

  const hasValidTelemetry = useCallback((sensorData: SensorData | null) => {
    if (!sensorData) return false;

    return (
      typeof sensorData.temperatura === 'number' &&
      Number.isFinite(sensorData.temperatura) &&
      typeof sensorData.umidade === 'number' &&
      Number.isFinite(sensorData.umidade)
    );
  }, []);

  const checkAlerts = useCallback((sensorData: SensorData) => {
    const tempOutOfRange = sensorData.temperatura < TEMP_MIN || sensorData.temperatura > TEMP_MAX;
    const humidityOutOfRange = sensorData.umidade < HUMIDITY_MIN || sensorData.umidade > HUMIDITY_MAX;
    const co2OutOfRange = typeof sensorData.co2 === 'number' && sensorData.co2 > CO2_MAX;

    if (tempOutOfRange && !lastAlertRef.current.temp) {
      toast({
        variant: 'destructive',
        title: 'Alerta de temperatura',
        description: `Temperatura fora da faixa ideal: ${sensorData.temperatura.toFixed(1)}°C (ideal: ${TEMP_MIN}-${TEMP_MAX}°C)`,
      });
      lastAlertRef.current.temp = true;
    } else if (!tempOutOfRange && lastAlertRef.current.temp) {
      toast({
        title: 'Temperatura normalizada',
        description: `Temperatura voltou ao normal: ${sensorData.temperatura.toFixed(1)}°C`,
      });
      lastAlertRef.current.temp = false;
    }

    if (humidityOutOfRange && !lastAlertRef.current.humidity) {
      toast({
        variant: 'destructive',
        title: 'Alerta de umidade',
        description: `Umidade fora da faixa ideal: ${sensorData.umidade.toFixed(0)}% (ideal: ${HUMIDITY_MIN}-${HUMIDITY_MAX}%)`,
      });
      lastAlertRef.current.humidity = true;
    } else if (!humidityOutOfRange && lastAlertRef.current.humidity) {
      toast({
        title: 'Umidade normalizada',
        description: `Umidade voltou ao normal: ${sensorData.umidade.toFixed(0)}%`,
      });
      lastAlertRef.current.humidity = false;
    }

    if (co2OutOfRange && !lastAlertRef.current.co2) {
      toast({
        variant: 'destructive',
        title: 'Alerta de CO2',
        description: `Nivel de CO2 elevado: ${sensorData.co2} ppm (max: ${CO2_MAX} ppm)`,
      });
      lastAlertRef.current.co2 = true;
    } else if (typeof sensorData.co2 === 'number' && !co2OutOfRange && lastAlertRef.current.co2) {
      toast({
        title: 'CO2 normalizado',
        description: `CO2 voltou ao normal: ${sensorData.co2} ppm`,
      });
      lastAlertRef.current.co2 = false;
    }
  }, []);

  const fetchLatestRow = useCallback(async (filter?: ResolvedDeviceFilter) => {
    let query = externalSupabase
      .from('viniferasense_data')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (filter) {
      query = query.eq(filter.column, filter.candidate);
    }

    return query.maybeSingle();
  }, []);

  const fetchLatestData = useCallback(async () => {
    setLoading(true);

    let rawData: RawSensorRow | null = null;
    let fetchError: string | null = null;
    const candidates = normalizeDeviceCandidates(deviceId);

    if (!deviceId) {
      const { data: latestRow, error: latestError } = await fetchLatestRow();
      rawData = (latestRow as RawSensorRow | null) ?? null;
      fetchError = latestError?.message ?? null;
    } else {
      const filtersToTry: ResolvedDeviceFilter[] = [];

      if (resolvedFilterRef.current && candidates.includes(resolvedFilterRef.current.candidate)) {
        filtersToTry.push(resolvedFilterRef.current);
      }

      for (const candidate of candidates) {
        for (const column of ['device_code', 'device_id'] as const) {
          if (
            filtersToTry.some(
              (filter) => filter.column === column && filter.candidate === candidate
            )
          ) {
            continue;
          }

          filtersToTry.push({ column, candidate });
        }
      }

      for (const filter of filtersToTry) {
        const { data: latestRow, error: latestError } = await fetchLatestRow(filter);

        if (latestError) {
          if (looksLikeMissingColumnError(latestError.message, filter.column)) {
            continue;
          }

          fetchError = latestError.message;
          continue;
        }

        if (latestRow) {
          rawData = latestRow as RawSensorRow;
          resolvedFilterRef.current = filter;
          fetchError = null;
          break;
        }
      }
    }

    const normalizedData = rawData ? normalizeSensorData(rawData) : null;

    if (fetchError) {
      setData(null);
      setError(fetchError);
    } else if (hasValidTelemetry(normalizedData)) {
      checkAlerts(normalizedData);
      setData(normalizedData);
      setError(null);
    } else if (rawData) {
      setData(null);
      setError('Telemetria recebida, mas ainda sem temperatura e umidade validas');
    } else {
      setData(null);
      setError(deviceId ? `Aguardando dados do beacon ${deviceId}` : 'Sem dados de telemetria');
    }

    setLoading(false);
  }, [checkAlerts, deviceId, fetchLatestRow, hasValidTelemetry]);

  useEffect(() => {
    resolvedFilterRef.current = null;
  }, [deviceId]);

  useEffect(() => {
    fetchLatestData();

    const interval = setInterval(fetchLatestData, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [fetchLatestData]);

  const calculateRiskLevel = (sensorData: SensorData | null): RiskLevel => {
    if (!sensorData) return 'baixo';

    const tempRisk = sensorData.temperatura < 2 || sensorData.temperatura > 8;
    const humidityRisk = sensorData.umidade < 70 || sensorData.umidade > 95;
    const vibrationRisk = sensorData.vibracao === 'Alta';
    const riskCount = [tempRisk, humidityRisk, vibrationRisk].filter(Boolean).length;

    if (riskCount >= 2) return 'alto';
    if (riskCount === 1) return 'medio';
    return 'baixo';
  };

  const calculateCargoStatus = (sensorData: SensorData | null): CargoStatus => {
    const risk = calculateRiskLevel(sensorData);
    if (risk === 'alto') return 'critico';
    if (risk === 'medio') return 'atencao';
    return 'saudavel';
  };

  const calculateQualityScore = (sensorData: SensorData | null): number => {
    if (!sensorData) return 0;

    let score = 100;

    if (sensorData.temperatura < 2 || sensorData.temperatura > 8) {
      score -= 25;
    } else if (sensorData.temperatura < 3 || sensorData.temperatura > 6) {
      score -= 10;
    }

    if (sensorData.umidade < 70 || sensorData.umidade > 95) {
      score -= 25;
    } else if (sensorData.umidade < 80 || sensorData.umidade > 92) {
      score -= 10;
    }

    if (typeof sensorData.co2 === 'number') {
      if (sensorData.co2 > 500) {
        score -= 15;
      } else if (sensorData.co2 > 450) {
        score -= 5;
      }
    }

    if (sensorData.vibracao === 'Alta') {
      score -= 20;
    } else if (sensorData.vibracao === 'Moderada') {
      score -= 5;
    }

    return Math.max(0, score);
  };

  return {
    data,
    loading,
    error,
    riskLevel: calculateRiskLevel(data),
    cargoStatus: calculateCargoStatus(data),
    qualityScore: calculateQualityScore(data),
    refresh: fetchLatestData,
  };
};
