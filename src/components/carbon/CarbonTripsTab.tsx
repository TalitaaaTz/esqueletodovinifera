import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CarbonKPICard } from './CarbonKPICard';
import { useCarbonData } from '@/hooks/useCarbonData';
import {
  CarbonTrip,
  getTripStatusLabel,
  getTripStatusColor,
  getBadgeLabel,
  getBadgeColor,
} from '@/types/carbon';
import {
  Cloud,
  TreeDeciduous,
  DollarSign,
  Route,
  Eye,
  FileText,
  Truck,
  MapPin,
  Calendar,
  Weight,
  Ruler,
  Fuel,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TripDetailsProps {
  trip: CarbonTrip;
  emissions: {
    consumo_litros: number;
    emissions_kg_co2: number;
    emissions_tco2e: number;
    trees_equivalent: number;
    offset_cost_brl: number;
  };
}

const TripDetailsModal = ({ trip, emissions }: TripDetailsProps) => {
  return (
    <div className="space-y-6">
      {/* Trip Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <MapPin className="h-4 w-4" />
            Origem
          </div>
          <p className="font-medium">{trip.origem}</p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <MapPin className="h-4 w-4" />
            Destino
          </div>
          <p className="font-medium">{trip.destino}</p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Calendar className="h-4 w-4" />
            Data
          </div>
          <p className="font-medium">{new Date(trip.data_viagem).toLocaleDateString('pt-BR')}</p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Truck className="h-4 w-4" />
            Veículo
          </div>
          <p className="font-medium">{trip.veiculo_placa || '-'}</p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Weight className="h-4 w-4" />
            Peso
          </div>
          <p className="font-medium">{trip.peso_carga_tons.toFixed(1)} t</p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Ruler className="h-4 w-4" />
            Distância
          </div>
          <p className="font-medium">{trip.distancia_km.toLocaleString('pt-BR')} km</p>
        </div>
      </div>

      {/* Emission Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <CarbonKPICard
          title="Diesel"
          value={emissions.consumo_litros.toFixed(1)}
          unit="litros"
          icon={<Fuel className="h-4 w-4" />}
          tooltip="Consumo estimado de diesel"
        />
        <CarbonKPICard
          title="Emissões"
          value={emissions.emissions_kg_co2.toFixed(1)}
          unit="kg CO₂"
          icon={<Cloud className="h-4 w-4" />}
          variant="primary"
        />
        <CarbonKPICard
          title="Árvores"
          value={Math.round(emissions.trees_equivalent)}
          icon={<TreeDeciduous className="h-4 w-4" />}
          variant="success"
        />
        <CarbonKPICard
          title="Custo"
          value={`R$ ${emissions.offset_cost_brl.toFixed(2)}`}
          icon={<DollarSign className="h-4 w-4" />}
          variant="warning"
        />
      </div>

      {/* Formula explanation */}
      <div className="bg-muted/20 p-4 rounded-lg text-sm space-y-1">
        <p className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Cálculo</p>
        <p className="font-mono-data text-xs">
          Consumo = {trip.distancia_km} km ÷ {trip.media_km_por_litro || 2.5} km/L = <span className="text-primary font-semibold">{emissions.consumo_litros.toFixed(1)} L</span>
        </p>
        <p className="font-mono-data text-xs">
          CO₂ = {emissions.consumo_litros.toFixed(1)} L × 2,68 kg/L = <span className="text-primary font-semibold">{emissions.emissions_kg_co2.toFixed(1)} kg</span>
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <Button className="gap-2">
          <FileText className="h-4 w-4" />
          Gerar PDF da Viagem
        </Button>
      </div>
    </div>
  );
};

export const CarbonTripsTab = () => {
  const { filteredTrips, calculateTripEmissions, loading } = useCarbonData();
  const [selectedTrip, setSelectedTrip] = useState<CarbonTrip | null>(null);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-card/50 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Route className="h-4 w-4" />
            Todas as Viagens ({filteredTrips.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Origem → Destino</TableHead>
                  <TableHead>Caminhão</TableHead>
                  <TableHead className="text-right">Distância (km)</TableHead>
                  <TableHead className="text-right">Diesel (L)</TableHead>
                  <TableHead className="text-right">CO₂ (kg)</TableHead>
                  <TableHead className="text-right">Árvores</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Confiabilidade</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrips.map((trip) => {
                  const emissions = calculateTripEmissions(trip);
                  return (
                    <TableRow key={trip.id}>
                      <TableCell className="text-sm">
                        {new Date(trip.data_viagem).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {trip.origem} → {trip.destino}
                      </TableCell>
                      <TableCell className="text-sm">{trip.veiculo_placa || '-'}</TableCell>
                      <TableCell className="text-right font-mono-data text-sm">
                        {trip.distancia_km.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right font-mono-data text-sm">
                        {emissions.consumo_litros.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-right font-mono-data text-sm">
                        {emissions.emissions_kg_co2.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-right font-mono-data text-sm">
                        {Math.round(emissions.trees_equivalent)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getTripStatusColor(trip.status)} variant="outline">
                          {getTripStatusLabel(trip.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {trip.badge && (
                          <Badge className={getBadgeColor(trip.badge)} variant="outline">
                            {getBadgeLabel(trip.badge)}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7"
                              onClick={() => setSelectedTrip(trip)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Detalhes da Viagem</DialogTitle>
                            </DialogHeader>
                            <TripDetailsModal trip={trip} emissions={emissions} />
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {filteredTrips.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Cloud className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Dados insuficientes para cálculo de CO₂</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
