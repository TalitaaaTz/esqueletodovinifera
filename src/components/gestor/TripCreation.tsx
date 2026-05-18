import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, Route, Signal, X, Settings2 } from 'lucide-react';
import { TripCodeShare } from './TripCodeShare';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const ALL_SENSOR_VARS = [
  { key: 'temperatura', label: 'Temperatura (°C)' },
  { key: 'umidade', label: 'Umidade (%)' },
  { key: 'co2', label: 'CO₂ (ppm)' },
  { key: 'vibracao', label: 'Níveis de Impacto' },
  { key: 'respiracao', label: 'Respiração (mg/kg/h)' },
  { key: 'indice_cor', label: 'Índice de Maturação' },
  { key: 'estagio', label: 'Estágio Fisiológico' },
  { key: 'temperatura_carga', label: 'Temperatura por Contato' },
  { key: 'compostos_volateis', label: 'Compostos Voláteis' },
];

const DEFAULT_MONITORED = ['temperatura', 'umidade', 'co2', 'vibracao', 'respiracao', 'indice_cor', 'estagio', 'temperatura_carga'];
const DEFAULT_MOTORISTA_VISIBLE = ['temperatura', 'umidade', 'co2', 'vibracao'];

interface TripCreationProps {
  onCreateTrip: (trip: any) => Promise<any>;
  loading?: boolean;
}

export function TripCreation({ onCreateTrip, loading }: TripCreationProps) {
  const [open, setOpen] = useState(false);
  const [createdTripCode, setCreatedTripCode] = useState<string | null>(null);
  const [beaconInput, setBeaconInput] = useState('');
  const [beacons, setBeacons] = useState<{ code: string; name: string }[]>([]);
  const [monitored, setMonitored] = useState<string[]>(DEFAULT_MONITORED);
  const [motoristaVisible, setMotoristaVisible] = useState<string[]>(DEFAULT_MOTORISTA_VISIBLE);
  const [form, setForm] = useState({
    caminhao: '',
    origem: '',
    destino: '',
    tipo_carga: 'Frutas',
    peso_carga: '',
    data_saida: '',
    previsao_chegada: '',
  });

  const addBeacon = () => {
    const code = beaconInput.trim();
    if (!code) return;
    if (beacons.some(b => b.code === code)) {
      toast({ title: 'Beacon já adicionado', variant: 'destructive' });
      return;
    }
    setBeacons(prev => [...prev, { code, name: `Beacon #${code}` }]);
    setBeaconInput('');
  };

  const removeBeacon = (code: string) => {
    setBeacons(prev => prev.filter(b => b.code !== code));
  };

  const toggleVar = (key: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(key) ? list.filter(k => k !== key) : [...list, key]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const sensorConfig = {
      monitored,
      motorista_visible: motoristaVisible,
    };

    const result = await onCreateTrip({
      ...form,
      peso_carga: form.peso_carga ? Number(form.peso_carga) : null,
      data_saida: form.data_saida ? new Date(form.data_saida).toISOString() : null,
      previsao_chegada: form.previsao_chegada ? new Date(form.previsao_chegada).toISOString() : null,
      sensor_config: sensorConfig,
    });

    if (result) {
      // Link beacons to the trip
      if (beacons.length > 0) {
        const { error } = await supabase.from('trip_beacons').insert(
          beacons.map(b => ({
            trip_id: result.id,
            device_code: b.code,
            device_name: b.name,
          }))
        );
        if (error) {
          console.error('Error linking beacons:', error);
          toast({ title: 'Erro ao vincular beacons', description: error.message, variant: 'destructive' });
        }
      }

      setCreatedTripCode(result.trip_code);
      setOpen(false);
      setForm({ caminhao: '', origem: '', destino: '', tipo_carga: 'Frutas', peso_carga: '', data_saida: '', previsao_chegada: '' });
      setBeacons([]);
      setMonitored(DEFAULT_MONITORED);
      setMotoristaVisible(DEFAULT_MOTORISTA_VISIBLE);
    }
  };

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  if (createdTripCode) {
    return <TripCodeShare tripCode={createdTripCode} onClose={() => setCreatedTripCode(null)} />;
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        Criar Viagem
      </Button>
    );
  }

  return (
    <Card className="gradient-vs-card-dark">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Route className="h-5 w-5 text-primary" />
          Nova Viagem
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Trip details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Caminhão</Label>
              <Input placeholder="Ex: CAM-001" value={form.caminhao} onChange={e => update('caminhao', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Carga</Label>
              <Select value={form.tipo_carga} onValueChange={v => update('tipo_carga', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Frutas">Frutas</SelectItem>
                  <SelectItem value="Frutas Variadas">Frutas Variadas</SelectItem>
                  <SelectItem value="Carga Seca">Carga Seca</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Origem</Label>
              <Input placeholder="Cidade de origem" value={form.origem} onChange={e => update('origem', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Destino</Label>
              <Input placeholder="Cidade de destino" value={form.destino} onChange={e => update('destino', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Peso da Carga (kg)</Label>
              <Input type="number" placeholder="Ex: 5000" value={form.peso_carga} onChange={e => update('peso_carga', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Data de Saída</Label>
              <Input type="datetime-local" value={form.data_saida} onChange={e => update('data_saida', e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Previsão de Chegada</Label>
              <Input type="datetime-local" value={form.previsao_chegada} onChange={e => update('previsao_chegada', e.target.value)} />
            </div>
          </div>

          {/* Beacons section */}
          <div className="space-y-3 border-t border-border/40 pt-4">
            <div className="flex items-center gap-2">
              <Signal className="h-4 w-4 text-primary" />
              <Label className="text-base font-semibold">Beacons / Sensores</Label>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Código do beacon (ex: 1010)"
                value={beaconInput}
                onChange={e => setBeaconInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addBeacon())}
              />
              <Button type="button" variant="outline" size="sm" onClick={addBeacon} className="shrink-0">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {beacons.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {beacons.map(b => (
                  <Badge key={b.code} variant="secondary" className="gap-1.5 pr-1">
                    <Signal className="h-3 w-3" />
                    #{b.code}
                    <button type="button" onClick={() => removeBeacon(b.code)} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Sensor config section */}
          <div className="space-y-4 border-t border-border/40 pt-4">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-primary" />
              <Label className="text-base font-semibold">Variáveis de Monitoramento</Label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Monitoradas (Gestor)</p>
                {ALL_SENSOR_VARS.map(v => (
                  <label key={v.key} className="flex items-center gap-2 py-1 cursor-pointer">
                    <Checkbox
                      checked={monitored.includes(v.key)}
                      onCheckedChange={() => toggleVar(v.key, monitored, setMonitored)}
                    />
                    <span className="text-sm">{v.label}</span>
                  </label>
                ))}
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Visíveis para o Motorista</p>
                {ALL_SENSOR_VARS.map(v => (
                  <label key={v.key} className="flex items-center gap-2 py-1 cursor-pointer">
                    <Checkbox
                      checked={motoristaVisible.includes(v.key)}
                      onCheckedChange={() => toggleVar(v.key, motoristaVisible, setMotoristaVisible)}
                      disabled={!monitored.includes(v.key)}
                    />
                    <span className={`text-sm ${!monitored.includes(v.key) ? 'text-muted-foreground/50' : ''}`}>{v.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading} className="gap-2">
              <Plus className="h-4 w-4" />
              Criar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
