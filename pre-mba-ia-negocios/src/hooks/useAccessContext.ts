import { useCallback, useEffect, useState } from 'react';

import type { AccessContext } from '@/domain/types.ts';
import type { AccessProvider } from '@/services/access/AccessProvider.ts';

export type AccessState =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly context: AccessContext }
  | { readonly status: 'error'; readonly error: Error };

interface UseAccessContextResult {
  readonly state: AccessState;
  /** Re-reads the context in the background (keeps the current data on screen). */
  readonly refresh: () => void;
  /** Shows the loading state again and re-reads the context (after an error). */
  readonly retry: () => void;
}

export function useAccessContext(provider: AccessProvider): UseAccessContextResult {
  const [state, setState] = useState<AccessState>({ status: 'loading' });
  const [requestId, setRequestId] = useState(0);

  useEffect(() => {
    let isCurrent = true;
    provider.getAccessContext().then(
      (context) => {
        if (isCurrent) setState({ status: 'ready', context });
      },
      (error: unknown) => {
        if (isCurrent) {
          setState({
            status: 'error',
            error: error instanceof Error ? error : new Error(String(error)),
          });
        }
      },
    );
    return () => {
      isCurrent = false;
    };
  }, [provider, requestId]);

  const refresh = useCallback(() => {
    setRequestId((id) => id + 1);
  }, []);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setRequestId((id) => id + 1);
  }, []);

  return { state, refresh, retry };
}
