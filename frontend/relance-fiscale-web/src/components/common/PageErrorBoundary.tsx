import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

/**
 * Attrape toute erreur de rendu React dans les pages enfants et affiche
 * un écran d'erreur propre au lieu de laisser le body vide.
 */
export class PageErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error?.message ?? 'Erreur inconnue' };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[PageErrorBoundary] Erreur page:', error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, message: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-16 text-center">
          <div className="mb-4 text-5xl">⚠️</div>
          <h2 className="mb-2 text-lg font-semibold text-gray-800">
            Une erreur est survenue dans cette page
          </h2>
          <p className="mb-6 max-w-lg rounded bg-red-50 px-4 py-3 text-sm text-red-700 font-mono">
            {this.state.message}
          </p>
          <button
            onClick={this.handleRetry}
            className="rounded bg-[#7a1e1e] px-5 py-2 text-sm text-white hover:bg-[#5a1515]"
          >
            Réessayer
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
