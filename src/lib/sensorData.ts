export type SensorCardVariant = 'default' | 'healthy' | 'warning' | 'critical';

export const asFiniteNumber = (value: number | null | undefined): number | null => {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
};

export const formatSensorNumber = (
  value: number | null | undefined,
  fractionDigits = 1,
  fallback = '—'
): string => {
  const safeValue = asFiniteNumber(value);
  return safeValue === null ? fallback : safeValue.toFixed(fractionDigits);
};

export const formatSensorText = (
  value: string | null | undefined,
  fallback = 'Aguardando dados'
): string => {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
};

export const getRangeVariant = (
  value: number | null | undefined,
  min: number,
  max: number
): SensorCardVariant => {
  const safeValue = asFiniteNumber(value);
  if (safeValue === null) return 'default';
  return safeValue >= min && safeValue <= max ? 'healthy' : 'warning';
};

export const getThresholdVariant = (
  value: number | null | undefined,
  max: number
): SensorCardVariant => {
  const safeValue = asFiniteNumber(value);
  if (safeValue === null) return 'default';
  return safeValue <= max ? 'healthy' : 'warning';
};

export const getVibrationVariant = (value: string | null | undefined): SensorCardVariant => {
  if (!value) return 'default';
  if (value === 'OK' || value === 'Baixa') return 'healthy';
  if (value === 'Moderada') return 'warning';
  return 'critical';
};
