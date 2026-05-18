import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SensorCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: ReactNode;
  variant?: 'default' | 'healthy' | 'warning' | 'critical';
  className?: string;
}

export const SensorCard = ({
  title,
  value,
  unit,
  icon,
  variant = 'default',
  className,
}: SensorCardProps) => {
  const variantStyles = {
    default: 'bg-card/60 border-border/40',
    healthy: 'bg-[hsl(var(--vs-healthy))]/8 border-[hsl(var(--vs-healthy))]/20',
    warning: 'bg-[hsl(var(--vs-warning))]/8 border-[hsl(var(--vs-warning))]/20',
    critical: 'bg-[hsl(var(--vs-critical))]/8 border-[hsl(var(--vs-critical))]/20',
  };

  const iconBgStyles = {
    default: 'bg-primary/10',
    healthy: 'bg-[hsl(var(--vs-healthy))]/15',
    warning: 'bg-[hsl(var(--vs-warning))]/15',
    critical: 'bg-[hsl(var(--vs-critical))]/15',
  };

  const iconStyles = {
    default: 'text-primary',
    healthy: 'text-[hsl(var(--vs-healthy))]',
    warning: 'text-[hsl(var(--vs-warning))]',
    critical: 'text-[hsl(var(--vs-critical))]',
  };

  return (
    <div
      className={cn(
        'p-4 rounded-xl border backdrop-blur-sm transition-all hover:scale-[1.02] animate-fade-in',
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{title}</p>
          <div className="mt-2.5 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono-data text-foreground">
              {value}
            </span>
            {unit && (
              <span className="text-sm text-muted-foreground/70">{unit}</span>
            )}
          </div>
        </div>
        <div className={cn('p-2 rounded-lg', iconBgStyles[variant], iconStyles[variant])}>
          {icon}
        </div>
      </div>
    </div>
  );
};
