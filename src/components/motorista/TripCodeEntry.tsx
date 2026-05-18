import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { QrCode, Loader2, Truck, MapPin, Package, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Trip } from '@/hooks/useTrips';

interface TripCodeEntryProps {
  onTripLoaded: (trip: Trip) => void;
}

export function TripCodeEntry({ onTripLoaded }: TripCodeEntryProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadedTrip, setLoadedTrip] = useState<Trip | null>(null);

  const handleSearch = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      toast({ title: 'Erro', description: 'Digite o código da viagem.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await (supabase
        .from('trips')
        .select('*') as any)
        .eq('trip_code', trimmed)
        .single();

      if (error || !data) {
        toast({ title: 'Não encontrada', description: 'Nenhuma viagem encontrada com este código.', variant: 'destructive' });
        setLoadedTrip(null);
        return;
      }

      setLoadedTrip(data as unknown as Trip);
      toast({ title: 'Viagem encontrada!', description: `${(data as any).origem} → ${(data as any).destino}` });
    } catch {
      toast({ title: 'Erro', description: 'Erro ao buscar viagem.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (loadedTrip) {
      onTripLoaded(loadedTrip);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <QrCode className="h-5 w-5 text-primary" />
          Código da Viagem
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Ex: VFS-1234"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            className="font-mono text-lg tracking-wider"
            maxLength={8}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={loading} className="gap-2 shrink-0">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            Buscar
          </Button>
        </div>

        {loadedTrip && (
          <div className="space-y-3 p-4 rounded-lg bg-muted/50 border border-border/50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Viagem encontrada</span>
              <Badge variant="outline" className="font-mono">{loadedTrip.trip_code}</Badge>
            </div>

            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Caminhão:</span>
                <span className="font-medium">{loadedTrip.caminhao}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Rota:</span>
                <span className="font-medium">{loadedTrip.origem} → {loadedTrip.destino}</span>
              </div>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Carga:</span>
                <span className="font-medium">{loadedTrip.tipo_carga || 'N/A'} {loadedTrip.peso_carga ? `(${loadedTrip.peso_carga}kg)` : ''}</span>
              </div>
            </div>

            <Button onClick={handleConfirm} className="w-full gap-2 mt-2" size="lg">
              Carregar Viagem
            </Button>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center">
          Peça o código da viagem ao gestor para carregar as informações automaticamente.
        </p>
      </CardContent>
    </Card>
  );
}
