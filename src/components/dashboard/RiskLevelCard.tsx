import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { RiskLevel } from '@/types/database';

interface RiskLevelCardProps {
  level: RiskLevel;
  className?: string;
}

export const RiskLevelCard = ({ level, className }: RiskLevelCardProps) => {
  const config = {
    baixo: {
      icon: CheckCircle,
      label: 'Baixo',
      description: 'Condições ideais para transporte',
      gradient: 'gradient-vs-healthy',
      textColor: 'text-[hsl(var(--vs-healthy))]',
      bgColor: 'bg-[hsl(var(--vs-healthy))]/8',
      borderColor: 'border-[hsl(var(--vs-healthy))]/25',
      glow: 'shadow-[0_0_25px_-8px_hsl(var(--vs-healthy)/0.3)]',
    },
    medio: {
      icon: AlertTriangle,
      label: 'Médio',
      description: 'Atenção: alguns parâmetros fora do ideal',
      gradient: 'gradient-vs-warning',
      textColor: 'text-[hsl(var(--vs-warning))]',
      bgColor: 'bg-[hsl(var(--vs-warning))]/8',
      borderColor: 'border-[hsl(var(--vs-warning))]/25',
      glow: 'shadow-[0_0_25px_-8px_hsl(var(--vs-warning)/0.3)]',
    },
    alto: {
      icon: XCircle,
      label: 'Alto',
      description: 'Risco elevado: ação imediata requerida',
      gradient: 'gradient-vs-critical',
      textColor: 'text-[hsl(var(--vs-critical))]',
      bgColor: 'bg-[hsl(var(--vs-critical))]/8',
      borderColor: 'border-[hsl(var(--vs-critical))]/25',
      glow: 'shadow-[0_0_25px_-8px_hsl(var(--vs-critical)/0.3)]',
    },
  };

  const { icon: Icon, label, description, gradient, textColor, bgColor, borderColor, glow } = config[level];

  return (
    <div
      className={cn(
        'relative overflow-hidden p-6 rounded-2xl border animate-fade-in',
        bgColor,
        borderColor,
        glow,
        className
      )}
    >
      <div className="absolute -top-8 -right-8 w-32 h-32 opacity-[0.06]">
        <div className={cn('w-full h-full rounded-full blur-2xl', gradient)} />
      </div>
      <div className="relative flex items-center gap-4">
        <div className={cn('p-3.5 rounded-xl', gradient)}>
          <Icon className="h-8 w-8 text-white" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest">Nível de Risco</p>
          <p className={cn('text-3xl font-bold mt-0.5', textColor)}>{label}</p>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
};
