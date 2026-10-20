import { z } from 'zod';

import type { AccessContext } from '@/domain/types.ts';
import { type Clock, createShiftedClock } from '@/services/clock.ts';

import type { AccessProvider } from './AccessProvider.ts';

/**
 * Messages exchanged with the D2L widget that hosts this page in an iframe (docs/D2L_WIDGET.md):
 *
 *   page   → widget  { type: 'xpe:ready', version: 1 }
 *   widget → page    { type: 'xpe:access', version: 1, data: { userId, enrolledAt, serverTime } }
 *   widget → page    { type: 'xpe:access-error', version: 1 }
 *
 * The widget script runs INSIDE Brightspace with the learner's own session, so the enrollment
 * date comes from D2L for the logged-in learner. Both sides only accept the other's exact origin.
 */
export const D2L_BRIDGE = {
  ready: 'xpe:ready',
  access: 'xpe:access',
  error: 'xpe:access-error',
  version: 1,
} as const;

const isoInstant = z
  .string()
  .trim()
  .refine((value) => Number.isFinite(Date.parse(value)), { error: 'Data inválida.' });

const accessMessageSchema = z.object({
  type: z.literal(D2L_BRIDGE.access),
  version: z.literal(D2L_BRIDGE.version),
  data: z.object({
    userId: z.union([z.string(), z.number()]).transform(String).nullable().optional(),
    enrolledAt: isoInstant.nullable(),
    /** Value of the HTTP `Date` header of the D2L response (RFC 1123), or ISO-8601. */
    serverTime: isoInstant.nullable().optional(),
  }),
});

const errorMessageSchema = z.object({
  type: z.literal(D2L_BRIDGE.error),
  version: z.literal(D2L_BRIDGE.version),
});

/** The bits of `window` the provider needs (injectable for tests). */
export interface BridgeHost {
  readonly parent: { postMessage(message: unknown, targetOrigin: string): void } | null;
  readonly self: unknown;
  addEventListener(type: 'message', listener: (event: MessageEvent) => void): void;
  removeEventListener(type: 'message', listener: (event: MessageEvent) => void): void;
}

export interface D2LWidgetAccessProviderOptions {
  /** Exact origin of the Brightspace site, e.g. "https://ava.xpeducacao.com.br". */
  readonly parentOrigin: string;
  readonly clock: Clock;
  /** Follow the D2L server clock (off while the date simulator `?today=` is active). */
  readonly useServerTime?: boolean;
  readonly host?: BridgeHost;
  /** Gives up and shows the page without an enrollment date after this long. */
  readonly timeoutMs?: number;
  /** Repeats `xpe:ready` until the widget answers (its script may load after the iframe). */
  readonly retryMs?: number;
}

interface Identity {
  readonly userId: string | null;
  readonly enrollmentDate: Date | null;
  readonly clock: Clock;
}

export class D2LWidgetAccessProvider implements AccessProvider {
  private readonly options: Required<Omit<D2LWidgetAccessProviderOptions, 'host'>> & {
    readonly host: BridgeHost;
  };

  private identity: Promise<Identity> | null = null;

  constructor({
    parentOrigin,
    clock,
    useServerTime = true,
    host = window,
    timeoutMs = 6_000,
    retryMs = 500,
  }: D2LWidgetAccessProviderOptions) {
    this.options = { parentOrigin, clock, useServerTime, host, timeoutMs, retryMs };
  }

  /** Cheap to call repeatedly: the handshake happens once per page load. */
  async getAccessContext(): Promise<AccessContext> {
    this.identity ??= this.handshake();
    const { userId, enrollmentDate, clock } = await this.identity;
    return { userId, enrollmentDate, now: clock.now() };
  }

  private handshake(): Promise<Identity> {
    const { parentOrigin, clock, useServerTime, host, timeoutMs, retryMs } = this.options;
    const anonymous: Identity = { userId: null, enrollmentDate: null, clock };

    // Opened outside an iframe: there is no widget to talk to.
    if (host.parent === null || host.parent === host.self) return Promise.resolve(anonymous);
    const parent = host.parent;

    return new Promise((resolve) => {
      let settled = false;
      const timers: {
        ping?: ReturnType<typeof setInterval>;
        timeout?: ReturnType<typeof setTimeout>;
      } = {};

      const finish = (identity: Identity) => {
        if (settled) return;
        settled = true;
        clearInterval(timers.ping);
        clearTimeout(timers.timeout);
        host.removeEventListener('message', onMessage);
        resolve(identity);
      };

      const onMessage = (event: MessageEvent) => {
        if (event.origin !== parentOrigin || event.source !== parent) return;

        const access = accessMessageSchema.safeParse(event.data);
        if (access.success) {
          const { userId, enrolledAt, serverTime } = access.data.data;
          finish({
            userId: userId ?? null,
            enrollmentDate: enrolledAt === null ? null : new Date(Date.parse(enrolledAt)),
            clock:
              useServerTime && serverTime
                ? createShiftedClock(clock, new Date(Date.parse(serverTime)))
                : clock,
          });
          return;
        }
        if (errorMessageSchema.safeParse(event.data).success) finish(anonymous);
      };

      const ping = () => {
        parent.postMessage({ type: D2L_BRIDGE.ready, version: D2L_BRIDGE.version }, parentOrigin);
      };

      host.addEventListener('message', onMessage);
      timers.ping = setInterval(ping, retryMs);
      timers.timeout = setTimeout(() => {
        console.warn('[acesso] O widget do D2L não respondeu; seguindo sem a data de inscrição.');
        finish(anonymous);
      }, timeoutMs);
      ping();
    });
  }
}

/** The page opened by the widget carries `?d2l=1` (see docs/D2L_WIDGET.md). */
export function isD2LWidgetLaunch(search: string, paramName: string): boolean {
  return new URLSearchParams(search).get(paramName) === '1';
}
