import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createFixedClock } from '../clock.ts';
import {
  type BridgeHost,
  D2L_BRIDGE,
  D2LWidgetAccessProvider,
  isD2LWidgetLaunch,
} from './D2LWidgetAccessProvider.ts';

const D2L = 'https://ava.exemplo.com';
const NOW = new Date('2026-10-20T15:00:00.000Z');

/** Fake iframe window: records what the page posts and lets the test play the widget. */
function createHost() {
  const posted: { message: unknown; targetOrigin: string }[] = [];
  const parent = {
    postMessage(message: unknown, targetOrigin: string) {
      posted.push({ message, targetOrigin });
    },
  };
  let listener: ((event: MessageEvent) => void) | null = null;
  const host: BridgeHost = {
    parent,
    self: {},
    addEventListener: (_type, fn) => {
      listener = fn;
    },
    removeEventListener: () => {
      listener = null;
    },
  };
  const send = (data: unknown, options: { origin?: string; source?: unknown } = {}) => {
    const { origin = D2L, source = parent } = options;
    listener?.({ data, origin, source } as unknown as MessageEvent);
  };
  return { host, posted, send, hasListener: () => listener !== null };
}

const accessMessage = (data: Record<string, unknown>) => ({
  type: D2L_BRIDGE.access,
  version: D2L_BRIDGE.version,
  data,
});

describe('D2LWidgetAccessProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const create = (host: BridgeHost, extra = {}) =>
    new D2LWidgetAccessProvider({
      parentOrigin: D2L,
      clock: createFixedClock(NOW),
      host,
      ...extra,
    });

  it('asks the widget (only at the D2L origin) and uses the enrollment date it sends', async () => {
    const { host, posted, send } = createHost();
    const context = create(host, { useServerTime: false }).getAccessContext();

    expect(posted[0]).toEqual({ message: { type: 'xpe:ready', version: 1 }, targetOrigin: D2L });
    send(
      accessMessage({ userId: 34520, enrolledAt: '2026-10-13T12:00:00.000Z', serverTime: null }),
    );

    await expect(context).resolves.toEqual({
      userId: '34520',
      enrollmentDate: new Date('2026-10-13T12:00:00.000Z'),
      now: NOW,
    });
  });

  it('follows the D2L server clock sent with the answer', async () => {
    const { host, send } = createHost();
    const context = create(host).getAccessContext();
    send(
      accessMessage({
        enrolledAt: '2026-10-13T12:00:00.000Z',
        serverTime: 'Tue, 20 Oct 2026 18:00:00 GMT',
      }),
    );
    expect((await context).now.toISOString()).toBe('2026-10-20T18:00:00.000Z');
  });

  it('ignores messages from other origins, other windows and malformed payloads', async () => {
    const { host, send } = createHost();
    const provider = create(host, { useServerTime: false });
    const context = provider.getAccessContext();

    send(accessMessage({ enrolledAt: '2020-01-01T00:00:00Z' }), {
      origin: 'https://site-malicioso.com',
    });
    send(accessMessage({ enrolledAt: '2020-01-01T00:00:00Z' }), { source: {} });
    send(accessMessage({ enrolledAt: 'ontem' }));
    send({ type: 'xpe:access', version: 2, data: { enrolledAt: '2020-01-01T00:00:00Z' } });
    send(accessMessage({ enrolledAt: '2026-10-13T12:00:00.000Z' }));

    expect((await context).enrollmentDate?.toISOString()).toBe('2026-10-13T12:00:00.000Z');
  });

  it('keeps asking until the widget answers, then stops', async () => {
    const { host, posted, send, hasListener } = createHost();
    const context = create(host, { retryMs: 500 }).getAccessContext();
    await vi.advanceTimersByTimeAsync(1_600);
    expect(posted).toHaveLength(4);

    send(accessMessage({ enrolledAt: null }));
    await context;
    await vi.advanceTimersByTimeAsync(5_000);
    expect(posted).toHaveLength(4);
    expect(hasListener()).toBe(false);
  });

  it('falls back to "no enrollment date" on widget error or timeout', async () => {
    const withError = createHost();
    const failed = create(withError.host).getAccessContext();
    withError.send({ type: 'xpe:access-error', version: 1 });
    await expect(failed).resolves.toMatchObject({ userId: null, enrollmentDate: null });

    const silent = createHost();
    const timedOut = create(silent.host, { timeoutMs: 6_000 }).getAccessContext();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    await vi.advanceTimersByTimeAsync(6_000);
    await expect(timedOut).resolves.toMatchObject({ userId: null, enrollmentDate: null });
  });

  it('does the handshake once and reuses it on later calls', async () => {
    const { host, posted, send } = createHost();
    const provider = create(host, { useServerTime: false });
    const first = provider.getAccessContext();
    send(accessMessage({ enrolledAt: '2026-10-13T12:00:00.000Z' }));
    await first;
    const count = posted.length;
    await provider.getAccessContext();
    expect(posted).toHaveLength(count);
  });

  it('answers at once, without a date, outside an iframe', async () => {
    const { host, posted } = createHost();
    const topWindow: BridgeHost = { ...host, parent: host.parent, self: host.parent };
    await expect(create(topWindow).getAccessContext()).resolves.toMatchObject({
      enrollmentDate: null,
    });
    expect(posted).toHaveLength(0);
  });
});

describe('isD2LWidgetLaunch', () => {
  it('is true only with ?d2l=1', () => {
    expect(isD2LWidgetLaunch('?d2l=1', 'd2l')).toBe(true);
    expect(isD2LWidgetLaunch('?d2l=0', 'd2l')).toBe(false);
    expect(isD2LWidgetLaunch('', 'd2l')).toBe(false);
  });
});
