import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CarbonKPICard } from './CarbonKPICard';
import { useCarbonData } from '@/hooks/useCarbonData';
import {
  getTripStatusLabel,
  getTripStatusColor,
  getBadgeLabel,
  getBadgeColor,
} from '@/types/carbon';
import {
  Cloud,
  TreeDeciduous,
  DollarSign,
  Truck,
  Route,
  Fuel,
  TrendingDown,
  Eye,
  Filter,
  X,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const CHART_COLORS = ['hsl(280, 100%, 65%)', 'hsl(142, 70%, 50%)', 'hsl(200, 80%, 60%)', 'hsl(45, 100%, 55%)'];

export const CarbonOverviewTab = () => {
  const {
    kpis,
    filteredTrips,
    settings,
    calculateTripEmissions,
    getEmissionsOverTime,
    getEmissionsByTruck,
    setDateRange,
    setTruckFilter,
    setStatusFilter,
    loading,
  } = useCarbonData();

  const [showFilters, setShowFilters] = useState(false);
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [selectedTruck, setSelectedTruck] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const handleApplyFilters = () => {
    setDateRange(
      dateStart ? new Date(dateStart) : null,
      dateEnd ? new Date(dateEnd) : null
    );
    setTruckFilter(selectedTruck === 'all' ? null : selectedTruck);
    setStatusFilter(selectedStatus === 'all' ? null : selectedStatus as any);
  };

  const handleClearFilters = () => {
    setDateStart('');
    setDateEnd('');
    setSelectedTruck('all');
    setSelectedStatus('all');
    setDateRange(null, null);
    setTruckFilter(null);
    setStatusFilter(null);
  };

  const emissionsOverTime = getEmissionsOverTime();
  const emissionsByTruck = getEmissionsByTruck();

  const uniqueTrucks = [...new Set(filteredTrips.map(t => t.veiculo_placa).filter(Boolean))];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-card/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="border-border bg-card/50">
        <CardHeader className="py-3 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Ocultar' : 'Mostrar'}
            </Button>
          </div>
        </CardHeader>
        {showFilters && (
          <CardContent className="pt-0 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Data Início</Label>
                <Input
                  type="date"
                  value={dateStart}
                  onChange={(e) => setDateStart(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Data Fim</Label>
                <Input
                  type="date"
                  value={dateEnd}
                  onChange={(e) => setDateEnd(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Caminhão</Label>
                <Select value={selectedTruck} onValueChange={setSelectedTruck}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {uniqueTrucks.map((truck) => (
                      <SelectItem key={truck} value={truck!}>
                        {truck}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="concluida">Concluída</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button size="sm" onClick={handleApplyFilters}>
                Aplicar Filtros
              </Button>
              <Button size="sm" variant="outline" onClick={handleClearFilters}>
                <X className="h-3 w-3 mr-1" />
                Limpar
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <CarbonKPICard
          title="Emissões Totais"
          value={(kpis.total_emissions_tco2e * 1000).toFixed(1)}
          unit="kg CO₂"
          icon={<Cloud className="h-4 w-4" />}
          tooltip="Total de CO₂ emitido no período selecionado"
          variant="primary"
        />
        <CarbonKPICard
          title="Média por Viagem"
          value={(kpis.avg_emissions_per_trip * 1000).toFixed(1)}
          unit="kg CO₂"
          icon={<TrendingDown className="h-4 w-4" />}
          tooltip="Média de emissões por viagem realizada"
        />
        <CarbonKPICard
          title="Diesel Total"
          value={kpis.total_diesel_liters.toFixed(0)}
          unit="litros"
          icon={<Fuel className="h-4 w-4" />}
          tooltip="Total de diesel consumido estimado"
        />
        {settings.show_trees_equivalent && (
          <CarbonKPICard
            title="Árvores Equiv."
            value={Math.round(kpis.trees_equivalent)}
            unit="árvores"
            icon={<TreeDeciduous className="h-4 w-4" />}
            tooltip="Quantidade de árvores necessárias para absorver as emissões geradas"
            variant="success"
          />
        )}
        {settings.show_offset_cost && (
          <CarbonKPICard
            title="Custo Compensação"
            value={`R$ ${kpis.offset_cost_brl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            icon={<DollarSign className="h-4 w-4" />}
            tooltip="Custo estimado para compensar as emissões através de plantio de árvores"
            variant="warning"
          />
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Line Chart - Emissions Over Time */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Emissões ao Longo do Tempo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={emissionsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="emissions"
                    name="Emissões (tCO₂e)"
                    stroke="hsl(280, 100%, 65%)"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(280, 100%, 65%)' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Bar Chart - Emissions by Truck */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Emissões por Caminhão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={emissionsByTruck}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="truck"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="emissions" name="Emissões (tCO₂e)" fill="hsl(142, 70%, 50%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart - Distribution by Truck */}
        <Card className="border-border lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Participação por Caminhão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={emissionsByTruck}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="emissions"
                    nameKey="truck"
                    label={({ truck, percent }) => `${truck}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                  >
                    {emissionsByTruck.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value.toFixed(4)} tCO₂e`, 'Emissões']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Table */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Route className="h-4 w-4" />
            Resumo de Viagens ({filteredTrips.length})
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
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrips.slice(0, 10).map((trip) => {
                  const emissions = calculateTripEmissions(trip);
                  return (
                    <TableRow key={trip.id}>
                      <TableCell className="text-sm">
                        {new Date(trip.data_viagem).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {trip.origem} → {trip.destino}
                      </TableCell>
                      <TableCell className="text-sm">{trip.veiculo_placa}</TableCell>
                      <TableCell className="text-right font-mono-data text-sm">
                        {trip.distancia_km.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right font-mono-data text-sm">
                        {emissions.consumo_litros.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-right font-mono-data text-sm">
                        {emissions.emissions_kg_co2.toFixed(1)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getTripStatusColor(trip.status)} variant="outline">
                          {getTripStatusLabel(trip.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-7">
                          <Eye className="h-3 w-3" />
                        </Button>
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
