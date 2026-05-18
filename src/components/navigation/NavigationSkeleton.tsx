import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

interface NavigationSkeletonProps {
  variant?: 'loading' | 'gps' | 'route';
  message?: string;
}

export function NavigationSkeleton({ 
  variant = 'loading', 
  message 
}: NavigationSkeletonProps) {
  const getMessage = () => {
    if (message) return message;
    switch (variant) {
      case 'gps':
        return 'Obtendo localização GPS...';
      case 'route':
        return 'Calculando melhor rota...';
      default:
        return 'Carregando mapa...';
    }
  };

  return (
    <div 
      className="relative flex flex-col bg-muted/30 rounded-xl overflow-hidden" 
      style={{ height: 'calc(100vh - 180px)', minHeight: '400px' }}
    >
      {/* Map skeleton with shimmer effect */}
      <div className="flex-1 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-muted/50 via-muted/30 to-muted/50">
          {/* Grid lines to simulate map */}
          <div className="absolute inset-0 opacity-10">
            <div 
              className="h-full w-full" 
              style={{
                backgroundImage: `
                  linear-gradient(to right, hsl(var(--foreground) / 0.1) 1px, transparent 1px),
                  linear-gradient(to bottom, hsl(var(--foreground) / 0.1) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px'
              }}
            />
          </div>
        </div>

        {/* Animated shimmer overlay */}
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite]"
            style={{
              background: 'linear-gradient(90deg, transparent, hsl(var(--background) / 0.4), transparent)',
            }}
          />
        </div>

        {/* Fake route line skeleton */}
        {variant === 'route' && (
          <svg 
            className="absolute inset-0 w-full h-full opacity-20"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <path
              d="M 20 80 Q 30 60 50 50 T 80 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              strokeDasharray="2 2"
              className="animate-pulse"
            />
          </svg>
        )}

        {/* Center loading indicator */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-background/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm font-medium text-foreground">{getMessage()}</p>
            {variant === 'route' && (
              <p className="text-xs text-muted-foreground">
                Isso pode levar alguns segundos
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom panel skeleton */}
      <Card className="absolute bottom-0 left-0 right-0 rounded-t-2xl rounded-b-none border-b-0">
        <CardContent className="pt-4 pb-4">
          {/* Search input skeleton */}
          <Skeleton className="h-10 w-full mb-4" />

          {/* Stats grid skeleton */}
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div 
                key={i} 
                className="flex flex-col items-center justify-center p-3 bg-muted/30 rounded-xl"
              >
                <Skeleton className="h-5 w-5 rounded-full mb-1" />
                <Skeleton className="h-6 w-12 mb-1" />
                <Skeleton className="h-3 w-10" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Add shimmer animation to index.css via style
const shimmerStyle = document.createElement('style');
shimmerStyle.textContent = `
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
`;
if (typeof document !== 'undefined') {
  document.head.appendChild(shimmerStyle);
}

export default NavigationSkeleton;
