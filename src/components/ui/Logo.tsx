import { cn } from '@/lib/utils';
import logoImg from '@/assets/logo-viniferasense.png';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark';
}

export const Logo = ({ className, size = 'md' }: LogoProps) => {
  const sizes = {
    sm: { img: 'h-8', text: 'text-base' },
    md: { img: 'h-10', text: 'text-xl' },
    lg: { img: 'h-16', text: 'text-3xl' },
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <img 
        src={logoImg} 
        alt="ViniferaSense" 
        className={cn(sizes[size].img, 'w-auto object-contain')}
      />
      <div className="flex flex-col">
        <span className={cn(
          'font-bold leading-tight text-foreground',
          sizes[size].text,
        )}>
          ViniferaSense
        </span>
        <span className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">
          Monitoramento Inteligente
        </span>
      </div>
    </div>
  );
};
