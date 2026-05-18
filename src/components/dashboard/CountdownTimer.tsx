import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Clock, Wind, RotateCcw, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CountdownTimerProps {
  className?: string;
  initialTime?: number; // in seconds
}

export const CountdownTimer = ({ className, initialTime = 2 * 60 * 60 }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : initialTime));
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused, initialTime]);

  const handleReset = useCallback(() => {
    setTimeLeft(initialTime);
    setIsPaused(false);
  }, [initialTime]);

  const handleTogglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const isUrgent = timeLeft < 15 * 60; // Less than 15 minutes
  const progress = ((initialTime - timeLeft) / initialTime) * 100;

  return (
    <div
      className={cn(
        'p-6 rounded-2xl border animate-fade-in relative overflow-hidden',
        isUrgent
          ? 'bg-vs-warning/10 border-vs-warning/30'
          : 'bg-card border-border',
        className
      )}
    >
      {/* Progress bar background */}
      <div 
        className={cn(
          'absolute bottom-0 left-0 h-1 transition-all duration-1000',
          isUrgent ? 'bg-vs-warning' : 'bg-primary/50'
        )}
        style={{ width: `${progress}%` }}
      />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wind className={cn('h-5 w-5', isUrgent ? 'text-vs-warning' : 'text-muted-foreground')} />
          <span className="text-sm text-muted-foreground font-medium">
            Próxima Purga de Etileno
          </span>
        </div>
        
        {/* Control buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleTogglePause}
            title={isPaused ? 'Continuar' : 'Pausar'}
          >
            {isPaused ? (
              <Play className="h-4 w-4 text-primary" />
            ) : (
              <Pause className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleReset}
            title="Resetar"
          >
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <div className={cn(
          'p-3 rounded-xl',
          isUrgent ? 'bg-vs-warning/20' : 'bg-primary/10'
        )}>
          <Clock className={cn(
            'h-8 w-8',
            isUrgent ? 'text-vs-warning animate-pulse' : 'text-primary',
            isPaused && 'opacity-50'
          )} />
        </div>
        <div className="flex flex-col">
          <div className={cn(
            'font-mono text-4xl font-bold tracking-tight',
            isUrgent ? 'text-vs-warning' : 'text-foreground',
            isPaused && 'opacity-70'
          )}>
            {String(hours).padStart(2, '0')}
            <span className="text-muted-foreground mx-0.5">:</span>
            {String(minutes).padStart(2, '0')}
            <span className="text-muted-foreground mx-0.5">:</span>
            {String(seconds).padStart(2, '0')}
          </div>
          {isPaused && (
            <span className="text-xs text-muted-foreground mt-1">⏸ Pausado</span>
          )}
        </div>
      </div>
      
      {isUrgent && !isPaused && (
        <p className="mt-3 text-sm text-vs-warning font-medium">
          ⚠️ Prepare-se para abrir as portas
        </p>
      )}
    </div>
  );
};
