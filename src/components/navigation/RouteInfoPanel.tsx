import { Clock, Route, RefreshCw } from 'lucide-react';

interface RouteInfoPanelProps {
  duration: number | null;
  distance: number | null;
  cargoStatus: 'saudavel' | 'atencao' | 'critico';
  isRecalculating?: boolean;
}

export function RouteInfoPanel({
  duration,
  distance,
  cargoStatus,
  isRecalculating = false,
}: RouteInfoPanelProps) {
  // Format duration
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes} min`;
  };

  // Format distance
  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
  };

  // Get cargo status color
  const getStatusColor = () => {
    switch (cargoStatus) {
      case 'saudavel':
        return 'bg-green-500';
      case 'atencao':
        return 'bg-amber-500';
      case 'critico':
        return 'bg-red-500';
      default:
        return 'bg-muted';
    }
  };

  const getStatusText = () => {
    switch (cargoStatus) {
      case 'saudavel':
        return 'Carga Saudável';
      case 'atencao':
        return 'Atenção';
      case 'critico':
        return 'Crítico';
      default:
        return 'Desconhecido';
    }
  };

  return (
    <div className="grid grid-cols-3 gap-3">
      {/* ETA */}
      <div className="flex flex-col items-center justify-center p-3 bg-muted/30 rounded-xl relative">
        {isRecalculating ? (
          <RefreshCw className="h-5 w-5 text-primary mb-1 animate-spin" />
        ) : (
          <Clock className="h-5 w-5 text-primary mb-1" />
        )}
        <span className="text-lg font-bold">
          {duration !== null ? formatDuration(duration) : '--'}
        </span>
        <span className="text-xs text-muted-foreground">Tempo</span>
      </div>

      {/* Distance */}
      <div className="flex flex-col items-center justify-center p-3 bg-muted/30 rounded-xl">
        <Route className="h-5 w-5 text-primary mb-1" />
        <span className="text-lg font-bold">
          {distance !== null ? formatDistance(distance) : '--'}
        </span>
        <span className="text-xs text-muted-foreground">Distância</span>
      </div>

      {/* Cargo Status */}
      <div className="flex flex-col items-center justify-center p-3 bg-muted/30 rounded-xl">
        <div className={`w-5 h-5 rounded-full ${getStatusColor()} mb-1`} />
        <span className="text-sm font-semibold truncate w-full text-center">
          {getStatusText()}
        </span>
        <span className="text-xs text-muted-foreground">Carga</span>
      </div>
    </div>
  );
}

export default RouteInfoPanel;
