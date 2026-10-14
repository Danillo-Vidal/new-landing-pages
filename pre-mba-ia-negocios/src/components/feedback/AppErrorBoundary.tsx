import { Component, type ErrorInfo, type ReactNode } from 'react';

import { Button } from '@/components/ui/button.tsx';
import { uiText } from '@/content/ui-text.ts';

interface AppErrorBoundaryProps {
  readonly children: ReactNode;
}

interface AppErrorBoundaryState {
  readonly hasError: boolean;
}

/** Last line of defense: an unexpected render error never leaves a blank page in the LMS. */
export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  override state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[AppErrorBoundary]', error, info.componentStack);
  }

  override render(): ReactNode {
    if (!this.state.hasError) return this.props.children;
    const copy = uiText.errors;
    return (
      <main className="grid min-h-dvh place-items-center bg-neutral-50 px-4">
        <section role="alert" className="max-w-md text-center">
          <h1 className="text-2xl font-bold tracking-[-0.02em] text-ink-950">
            {copy.unexpectedTitle}
          </h1>
          <p className="mt-2 text-neutral-600">{copy.unexpectedDescription}</p>
          <Button variant="primary" className="mt-6" onClick={() => window.location.reload()}>
            {copy.reload}
          </Button>
        </section>
      </main>
    );
  }
}
