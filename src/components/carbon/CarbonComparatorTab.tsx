import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CarbonKPICard } from './CarbonKPICard';
import { useCarbonData } from '@/hooks/useCarbonData';
import {
  calculateDieselConsumption,
  calculateEmissionsKg,
  calculateEmissionsTco2e,
  calculateTreesEquivalent,
  calculateOffsetCost,
} from '@/types/carbon';
import {
  Cloud,
  TreeDeciduous,
  DollarSign,
  TrendingDown,
  Calculator,
  ArrowLeftRight,
  Fuel,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ComparisonResult {
  consumo_atual_litros: number;
  consumo_otimizado_litros: number;
  emissions_atual_kg: number;
  emissions_otimizada_kg: number;
  emissions_evitadas_kg: number;
  reducao_percentual: number;
  trees_equivalent: number;
  offset_cost_brl: number;
}

export const CarbonComparatorTab = () => {
  const { settings } = useCarbonData();

  const [formData, setFormData] = useState({
    origem: '',
    destino: '',
    distancia_atual: '',
    distancia_otimizada: '',
    media_km_por_litro: String(settings.default_km_per_liter),
  });

  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleCompare = () => {
    const distanciaAtual = parseFloat(formData.distancia_atual);
    const distanciaOtimizada = parseFloat(formData.distancia_otimizada);
    const mediaKmL = parseFloat(formData.media_km_por_litro);

    if (!formData.origem || !formData.destino) {
      setError('Preencha origem e destino');
      return;
    }

    if (isNaN(distanciaAtual) || isNaN(distanciaOtimizada) || isNaN(mediaKmL)) {
      setError('Preencha todos os campos numéricos corretamente');
      return;
    }

    if (distanciaAtual <= 0 || distanciaOtimizada <= 0 || mediaKmL <= 0) {
      setError('Os valores devem ser maiores que zero');
      return;
    }

    const consumoAtual = calculateDieselConsumption(distanciaAtual, undefined, mediaKmL);
    const consumoOtimizado = calculateDieselConsumption(distanciaOtimizada, undefined, mediaKmL);

    const emissionsAtualKg = calculateEmissionsKg(consumoAtual, settings.emission_factor_kg_per_liter);
    const emissionsOtimizadaKg = calculateEmissionsKg(consumoOtimizado, settings.emission_factor_kg_per_liter);
    const emissionsEvitadasKg = emissionsAtualKg - emissionsOtimizadaKg;
    const reducaoPercentual = (emissionsEvitadasKg / emissionsAtualKg) * 100;

    const emissionsEvitadasTco2e = calculateEmissionsTco2e(emissionsEvitadasKg);
    const treesEquivalent = calculateTreesEquivalent(emissionsEvitadasTco2e);
    const offsetCost = calculateOffsetCost(treesEquivalent);

    setResult({
      consumo_atual_litros: consumoAtual,
      consumo_otimizado_litros: consumoOtimizado,
      emissions_atual_kg: emissionsAtualKg,
      emissions_otimizada_kg: emissionsOtimizadaKg,
      emissions_evitadas_kg: emissionsEvitadasKg,
      reducao_percentual: reducaoPercentual,
      trees_equivalent: treesEquivalent,
      offset_cost_brl: offsetCost,
    });
  };

  const chartData = result
    ? [
        { name: 'Cenário Atual', emissions: result.emissions_atual_kg },
        { name: 'Cenário Otimizado', emissions: result.emissions_otimizada_kg },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Form */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5" />
            Comparador de Cenários
          </CardTitle>
          <CardDescription>
            Compare as emissões entre uma rota atual e uma rota otimizada
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="origem">Origem *</Label>
              <Input
                id="origem"
                placeholder="Ex: São Paulo, SP"
                value={formData.origem}
                onChange={(e) => handleInputChange('origem', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destino">Destino *</Label>
              <Input
                id="destino"
                placeholder="Ex: Rio de Janeiro, RJ"
                value={formData.destino}
                onChange={(e) => handleInputChange('destino', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="media_km_por_litro">Média (km/L) *</Label>
              <Input
                id="media_km_por_litro"
                type="number"
                step="0.1"
                placeholder="Ex: 2.5"
                value={formData.media_km_por_litro}
                onChange={(e) => handleInputChange('media_km_por_litro', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="distancia_atual">Distância Atual (km) *</Label>
              <Input
                id="distancia_atual"
                type="number"
                placeholder="Ex: 450"
                value={formData.distancia_atual}
                onChange={(e) => handleInputChange('distancia_atual', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="distancia_otimizada">Distância Otimizada (km) *</Label>
              <Input
                id="distancia_otimizada"
                type="number"
                placeholder="Ex: 380"
                value={formData.distancia_otimizada}
                onChange={(e) => handleInputChange('distancia_otimizada', e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="mt-6">
            <Button onClick={handleCompare} className="gap-2">
              <Calculator className="h-4 w-4" />
              Comparar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <CarbonKPICard
              title="Emissões Atuais"
              value={result.emissions_atual_kg.toFixed(1)}
              unit="kg CO₂"
              icon={<Cloud className="h-4 w-4" />}
              variant="warning"
            />
            <CarbonKPICard
              title="Emissões Otimizadas"
              value={result.emissions_otimizada_kg.toFixed(1)}
              unit="kg CO₂"
              icon={<Cloud className="h-4 w-4" />}
              variant="success"
            />
            <CarbonKPICard
              title="Emissões Evitadas"
              value={result.emissions_evitadas_kg.toFixed(1)}
              unit="kg CO₂"
              icon={<TrendingDown className="h-4 w-4" />}
              variant="primary"
            />
            <CarbonKPICard
              title="Redução"
              value={result.reducao_percentual.toFixed(1)}
              unit="%"
              icon={<TrendingDown className="h-4 w-4" />}
              variant="success"
            />
            {settings.show_trees_equivalent && (
              <CarbonKPICard
                title="Árvores Equiv."
                value={Math.round(result.trees_equivalent)}
                unit="árvores"
                icon={<TreeDeciduous className="h-4 w-4" />}
                tooltip="Árvores equivalentes às emissões evitadas"
              />
            )}
            {settings.show_offset_cost && (
              <CarbonKPICard
                title="Economia"
                value={`R$ ${result.offset_cost_brl.toFixed(2)}`}
                icon={<DollarSign className="h-4 w-4" />}
                tooltip="Economia estimada em compensação de carbono"
              />
            )}
          </div>

          {/* Diesel consumption comparison */}
          <div className="grid grid-cols-2 gap-4">
            <CarbonKPICard
              title="Diesel Atual"
              value={result.consumo_atual_litros.toFixed(1)}
              unit="litros"
              icon={<Fuel className="h-4 w-4" />}
              variant="warning"
            />
            <CarbonKPICard
              title="Diesel Otimizado"
              value={result.consumo_otimizado_litros.toFixed(1)}
              unit="litros"
              icon={<Fuel className="h-4 w-4" />}
              variant="success"
            />
          </div>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Comparação Visual (kg CO₂)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`${value.toFixed(1)} kg CO₂`, 'Emissões']}
                    />
                    <Legend />
                    <Bar
                      dataKey="emissions"
                      name="Emissões (kg CO₂)"
                      fill="hsl(280, 100%, 65%)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Summary Card */}
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/20">
                  <TrendingDown className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-semibold">
                    Você pode economizar{' '}
                    <span className="text-primary">{result.reducao_percentual.toFixed(1)}%</span> das
                    emissões
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Isso equivale a{' '}
                    <span className="font-medium">{result.emissions_evitadas_kg.toFixed(1)} kg de CO₂</span>{' '}
                    e{' '}
                    <span className="font-medium">{Math.round(result.trees_equivalent)} árvores</span>{' '}
                    que deixariam de ser necessárias para compensação.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
