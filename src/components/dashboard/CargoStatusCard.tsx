import { cn } from '@/lib/utils';
import { Package, Heart, AlertCircle, XOctagon } from 'lucide-react';
import { CargoStatus } from '@/types/database';

interface CargoStatusCardProps {
  status: CargoStatus;
  className?: string;
}

export const CargoStatusCard = ({ status, className }: CargoStatusCardProps) => {
  const config = {
    saudavel: {
      icon: Heart,
      label: 'SAUDÁVEL',
      gradient: 'gradient-vs-healthy',
      textColor: 'text-vs-healthy',
      animation: 'animate-pulse-slow',
    },
    atencao: {
      icon: AlertCircle,
      label: 'ATENÇÃO',
      gradient: 'gradient-vs-warning',
      textColor: 'text-vs-warning',
      animation: 'animate-pulse-ring',
    },
    critico: {
      icon: XOctagon,
      label: 'CRÍTICO',
      gradient: 'gradient-vs-critical',
      textColor: 'text-vs-critical',
      animation: 'animate-pulse',
    },
  };

  const { icon: Icon, label, gradient, textColor, animation } = config[status];

  return (
    <div
      className={cn(
        'p-6 rounded-2xl border border-border bg-card animate-fade-in',
        className
      )}
    >
      <div className="flex items-center gap-2 mb-4">
        <Package className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm text-muted-foreground font-medium">Status da Carga</span>
      </div>
      
      <div className="flex items-center gap-4">
        <div className={cn('p-4 rounded-xl', gradient, animation)}>
          <Icon className="h-10 w-10 text-white" />
        </div>
        <span className={cn('text-3xl font-bold', textColor)}>
          {label}
        </span>
      </div>
    </div>
  );
};
