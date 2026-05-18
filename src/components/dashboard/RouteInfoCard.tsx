import { cn } from '@/lib/utils';
import { MapPin, Truck, Package } from 'lucide-react';

interface RouteInfoCardProps {
  rota: string | null;
  veiculo: string | null;
  carga: string | null;
  className?: string;
}

export const RouteInfoCard = ({ rota, veiculo, carga, className }: RouteInfoCardProps) => {
  return (
    <div
      className={cn(
        'p-6 rounded-2xl border border-border bg-card animate-fade-in',
        className
      )}
    >
      <h3 className="font-semibold text-foreground mb-4">Informações do Transporte</h3>
      
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Rota</p>
            <p className="font-medium text-foreground">{rota || 'Não definida'}</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Truck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Veículo</p>
            <p className="font-medium text-foreground">{veiculo || 'Não identificado'}</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Carga</p>
            <p className="font-medium text-foreground">{carga || 'Não especificada'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
