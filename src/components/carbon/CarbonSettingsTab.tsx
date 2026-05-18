import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useCarbonData } from '@/hooks/useCarbonData';
import { DEFAULT_CARBON_SETTINGS } from '@/types/carbon';
import { Settings, TreeDeciduous, DollarSign, Gauge, RotateCcw, HelpCircle, Info, Fuel } from 'lucide-react';
import { toast } from 'sonner';

export const CarbonSettingsTab = () => {
  const { settings, updateSettings } = useCarbonData();

  const handleResetToDefaults = () => {
    updateSettings(DEFAULT_CARBON_SETTINGS);
    toast.success('Configurações restauradas para os valores padrão');
  };

  return (
    <div className="space-y-6">
      {/* Display Options */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Opções de Exibição
          </CardTitle>
          <CardDescription>
            Configure quais informações serão exibidas nos cards e relatórios
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <TreeDeciduous className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <Label htmlFor="show-trees" className="text-base font-medium">
                  Árvores Equivalentes
                </Label>
                <p className="text-sm text-muted-foreground">
                  Exibir equivalência em árvores para absorção de CO₂
                </p>
              </div>
            </div>
            <Switch
              id="show-trees"
              checked={settings.show_trees_equivalent}
              onCheckedChange={(checked) => updateSettings({ show_trees_equivalent: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <DollarSign className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <Label htmlFor="show-cost" className="text-base font-medium">
                  Custo de Compensação
                </Label>
                <p className="text-sm text-muted-foreground">
                  Exibir estimativa de custo para compensação de carbono
                </p>
              </div>
            </div>
            <Switch
              id="show-cost"
              checked={settings.show_offset_cost}
              onCheckedChange={(checked) => updateSettings({ show_offset_cost: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Calculation Settings */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            Fatores de Cálculo
          </CardTitle>
          <CardDescription>
            Ajuste os fatores utilizados nas fórmulas de cálculo de emissões
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="emission-factor" className="text-base font-medium">
                Fator de Emissão por Litro
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p className="text-xs">
                    Quantidade de CO₂ emitida por litro de diesel queimado. O valor padrão de
                    2,68 kg é a média utilizada no Brasil conforme metodologia do GHG Protocol.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-center gap-3">
              <Input
                id="emission-factor"
                type="number"
                step="0.01"
                className="max-w-xs"
                value={settings.emission_factor_kg_per_liter}
                onChange={(e) =>
                  updateSettings({ emission_factor_kg_per_liter: parseFloat(e.target.value) || 2.68 })
                }
              />
              <span className="text-sm text-muted-foreground">kg CO₂/litro</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Valor padrão: {DEFAULT_CARBON_SETTINGS.emission_factor_kg_per_liter} kg CO₂/litro diesel
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="default-kml" className="text-base font-medium">
                Média de Consumo Padrão
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p className="text-xs">
                    Quilômetros por litro padrão usado quando a viagem não tem o consumo real informado.
                    Carretas pesadas: ~2-3 km/L. Caminhões médios: ~3-5 km/L.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-center gap-3">
              <Input
                id="default-kml"
                type="number"
                step="0.1"
                className="max-w-xs"
                value={settings.default_km_per_liter}
                onChange={(e) =>
                  updateSettings({ default_km_per_liter: parseFloat(e.target.value) || 2.5 })
                }
              />
              <span className="text-sm text-muted-foreground">km/L</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Valor padrão: {DEFAULT_CARBON_SETTINGS.default_km_per_liter} km/L (carreta pesada)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Methodology Info */}
      <Card className="border-border bg-muted/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="h-5 w-5" />
            Metodologia de Cálculo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Fórmulas Utilizadas:</h4>
            <div className="bg-background/50 p-4 rounded-lg font-mono-data text-sm space-y-2">
              <p>
                <span className="text-primary">Consumo (L)</span> = distância_km ÷ média_km_por_litro
              </p>
              <p>
                <span className="text-primary">CO₂ (kg)</span> = consumo_litros × {settings.emission_factor_kg_per_liter} kg/L
              </p>
              <p>
                <span className="text-primary">CO₂ (tCO₂e)</span> = CO₂_kg ÷ 1.000
              </p>
              <p>
                <span className="text-primary">Árvores Equiv.</span> = emissões_tco2e ÷ 0,14
              </p>
              <p>
                <span className="text-primary">Custo (R$)</span> = árvores_equiv × 39
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-sm">Exemplo Prático:</h4>
            <div className="bg-background/50 p-4 rounded-lg text-sm space-y-1">
              <p>Carreta percorre <strong>1.000 km</strong> com consumo de <strong>2,5 km/L</strong>:</p>
              <p className="font-mono-data text-xs mt-2">Consumo = 1.000 ÷ 2,5 = <span className="text-primary font-bold">400 litros</span></p>
              <p className="font-mono-data text-xs">CO₂ = 400 × 2,68 = <span className="text-primary font-bold">1.072 kg</span> = <span className="text-primary font-bold">1,072 tCO₂e</span></p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-sm">Fatores que Afetam a Emissão:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>
                <strong>Idade e manutenção:</strong> Motores desregulados aumentam o consumo
              </li>
              <li>
                <strong>Peso da carga:</strong> Cargas mais pesadas aumentam o consumo de combustível
              </li>
              <li>
                <strong>Estilo de condução:</strong> Acelerações bruscas e alta velocidade aumentam as emissões
              </li>
              <li>
                <strong>Condições da estrada:</strong> Rodovias em mau estado aumentam o consumo
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-sm">Glossário:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>
                <strong>tCO₂e:</strong> Tonelada de CO₂ equivalente — unidade padrão para gases de efeito estufa
              </li>
              <li>
                <strong>Fator 2,68 kg/L:</strong> Média brasileira de CO₂ emitido por litro de diesel queimado
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Reset Button */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={handleResetToDefaults} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Restaurar Padrões
        </Button>
      </div>
    </div>
  );
};
