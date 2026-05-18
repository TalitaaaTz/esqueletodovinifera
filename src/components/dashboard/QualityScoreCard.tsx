import { cn } from '@/lib/utils';
import { Award } from 'lucide-react';

interface QualityScoreCardProps {
  score: number;
  className?: string;
}

export const QualityScoreCard = ({ score, className }: QualityScoreCardProps) => {
  const getScoreColor = () => {
    if (score >= 80) return 'text-[hsl(var(--vs-healthy))]';
    if (score >= 50) return 'text-[hsl(var(--vs-warning))]';
    return 'text-[hsl(var(--vs-critical))]';
  };

  const getScoreGradient = () => {
    if (score >= 80) return 'gradient-vs-healthy';
    if (score >= 50) return 'gradient-vs-warning';
    return 'gradient-vs-critical';
  };

  const getScoreGlow = () => {
    if (score >= 80) return 'shadow-[0_0_30px_-8px_hsl(var(--vs-healthy)/0.4)]';
    if (score >= 50) return 'shadow-[0_0_30px_-8px_hsl(var(--vs-warning)/0.4)]';
    return 'shadow-[0_0_30px_-8px_hsl(var(--vs-critical)/0.4)]';
  };

  const getScoreLabel = () => {
    if (score >= 90) return 'Excelente';
    if (score >= 80) return 'Muito Bom';
    if (score >= 70) return 'Bom';
    if (score >= 50) return 'Regular';
    return 'Crítico';
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden p-6 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm animate-fade-in',
        getScoreGlow(),
        className
      )}
    >
      <div className="absolute top-0 right-0 w-40 h-40 opacity-[0.07]">
        <div className={cn('w-full h-full rounded-full blur-3xl', getScoreGradient())} />
      </div>
      
      <div className="relative">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Award className="h-5 w-5 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground">ViniferaSense Quality Score</h3>
        </div>
        
        <div className="flex items-end gap-3">
          <div className={cn('text-6xl font-extrabold font-mono-data tracking-tighter', getScoreColor())}>
            {score}
          </div>
          <div className="pb-2">
            <span className="text-2xl text-muted-foreground/60 font-light">/100</span>
          </div>
        </div>
        
        <div className="mt-5">
          <div className="h-2.5 bg-muted/50 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-700', getScoreGradient())}
              style={{ width: `${score}%` }}
            />
          </div>
          <p className={cn('mt-2 text-sm font-semibold', getScoreColor())}>
            {getScoreLabel()}
          </p>
        </div>
      </div>
    </div>
  );
};
