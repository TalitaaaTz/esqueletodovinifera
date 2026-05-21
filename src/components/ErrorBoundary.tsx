import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import logoImg from '@/assets/logo-viniferasense.png';
import { clearAuthRecoveryState } from '@/lib/browserStorage';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Erro ao renderizar o app', error, errorInfo);
  }

  private handleReset = () => {
    clearAuthRecoveryState();
    window.location.assign('/auth');
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
        <img src={logoImg} alt="ViniferaSense" className="h-20 w-auto mb-5" />
        <div className="w-full max-w-md bg-[hsl(var(--vs-auth-card))] p-6 sm:p-8 rounded-2xl shadow-sm border border-border space-y-4">
          <div>
            <h1 className="text-xl font-bold text-foreground mb-2">Não foi possível carregar a tela</h1>
            <p className="text-sm text-muted-foreground">
              Limpamos o estado temporário e vamos te levar de volta ao login.
            </p>
          </div>

          <Button
            type="button"
            onClick={this.handleReset}
            className="w-full h-12 text-base font-semibold gradient-vs-primary hover:opacity-90 transition-opacity"
          >
            Voltar para o login
          </Button>
        </div>
      </div>
    );
  }
}
