import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CarbonKPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: ReactNode;
  tooltip?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning';
  className?: string;
}

export const CarbonKPICard = ({
  title,
  value,
  unit,
  icon,
  tooltip,
  trend,
  variant = 'default',
  className,
}: CarbonKPICardProps) => {
  const variantStyles = {
    default: 'bg-card border-border',
    primary: 'bg-primary/10 border-primary/30',
    success: 'bg-vs-healthy/10 border-green-500/30',
    warning: 'bg-vs-warning/10 border-yellow-500/30',
  };

  return (
    <Card className={cn('border', variantStyles[variant], className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            {icon}
            <span className="text-sm font-medium">{title}</span>
            {tooltip && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 cursor-help text-muted-foreground/60" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          {trend && (
            <span
              className={cn(
                'text-xs font-medium px-1.5 py-0.5 rounded',
                trend.isPositive
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              )}
            >
              {trend.isPositive ? '↓' : '↑'} {Math.abs(trend.value)}%
            </span>
          )}
        </div>
        <div className="mt-3">
          <span className="text-2xl font-bold text-foreground font-mono-data">
            {typeof value === 'number' ? value.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : value}
          </span>
          {unit && (
            <span className="ml-1 text-sm text-muted-foreground">{unit}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
