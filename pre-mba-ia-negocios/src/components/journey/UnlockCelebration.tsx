import { Lock, LockOpen } from 'lucide-react';
import { type CSSProperties, useEffect, useRef, useState } from 'react';

import { uiText } from '@/content/ui-text.ts';
import type { Celebration } from '@/hooks/useUnlockCelebration.ts';
import { cn } from '@/lib/cn.ts';

const CONFETTI_COUNT = 22;
const CONFETTI_CLASS = ['bg-brand-600', 'bg-brand-300', 'bg-white', 'bg-brand-200'] as const;

interface ConfettiPiece {
  readonly className: string;
  readonly style: CSSProperties;
}

/** Pieces radiate from the lock and fall; positions are random per celebration. */
function createConfetti(): ConfettiPiece[] {
  return Array.from({ length: CONFETTI_COUNT }, (_, index) => {
    const angle = (index / CONFETTI_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    const distance = 90 + Math.random() * 70;
    return {
      className: cn(
        CONFETTI_CLASS[index % CONFETTI_CLASS.length],
        index % 3 === 0 ? 'size-2 rounded-full' : 'h-3 w-2 rounded-[2px]',
      ),
      style: {
        '--dx': `${(Math.cos(angle) * distance).toFixed(1)}px`,
        '--dy': `${(Math.sin(angle) * distance * 0.8 - 30).toFixed(1)}px`,
        '--fall': `${String(Math.round(60 + Math.random() * 60))}px`,
        '--rot': `${String(Math.round((Math.random() - 0.5) * 540))}deg`,
        '--delay': `${String(Math.round(Math.random() * 120))}ms`,
      } as CSSProperties,
    };
  });
}

interface UnlockCelebrationProps {
  readonly celebration: Celebration;
  readonly isClosing: boolean;
  readonly onClose: () => void;
}

/**
 * "Aula N liberada!" sequence. Decorative (`aria-hidden`): the accessible announcement comes
 * from the journey live region. Only transform/opacity are animated (see `.unlock-*` CSS).
 */
export function UnlockCelebration({ celebration, isClosing, onClose }: UnlockCelebrationProps) {
  const { order, lessonTitle, released, total, isReducedMotion } = celebration;
  const [confetti] = useState(() => (isReducedMotion ? [] : createConfetti()));
  const overlayRef = useRef<HTMLDivElement>(null);

  // Native listener: the overlay is decorative, the keyboard path is Enter/Esc (see the hook).
  useEffect(() => {
    const overlay = overlayRef.current;
    overlay?.addEventListener('click', onClose);
    return () => overlay?.removeEventListener('click', onClose);
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      aria-hidden="true"
      data-state={isClosing ? 'closing' : 'open'}
      data-reduced-motion={isReducedMotion || undefined}
      className="unlock-overlay fixed inset-0 z-[60] grid cursor-pointer place-items-center bg-ink-950/90 p-6 text-center text-white"
    >
      <div>
        <div className="relative mx-auto grid size-48 place-items-center">
          <span className="unlock-glow absolute inset-0 rounded-full" />
          <span className="unlock-ring absolute top-1/2 left-1/2 -mt-14 -ml-14 size-28 rounded-full border-2 border-brand-300" />
          <span className="unlock-ring unlock-ring-late absolute top-1/2 left-1/2 -mt-14 -ml-14 size-28 rounded-full border-2 border-brand-300" />
          <span className="absolute top-1/2 left-1/2">
            {confetti.map((piece, index) => (
              <i
                key={index}
                className={cn('unlock-confetti absolute -mt-1.5 -ml-1', piece.className)}
                style={piece.style}
              />
            ))}
          </span>
          <span className="unlock-lock relative grid size-24 place-items-center rounded-[1.75rem] bg-brand-600 shadow-float ring-8 ring-white/10">
            <span className="unlock-shake grid size-full place-items-center">
              <Lock aria-hidden="true" className="unlock-icon-closed absolute size-11" />
              <LockOpen aria-hidden="true" className="unlock-icon-open absolute size-11" />
            </span>
          </span>
        </div>
        <p className="unlock-text mt-6 text-3xl font-bold tracking-[-0.02em]">
          {uiText.unlock.title(order)}
        </p>
        <p className="unlock-text unlock-text-2 mx-auto mt-2 max-w-sm text-base text-neutral-300">
          {lessonTitle}
        </p>
        <span className="unlock-text unlock-text-3 mt-5 inline-flex rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-semibold ring-1 ring-white/20">
          {uiText.unlock.chip(released, total)}
        </span>
        {celebration.note && (
          <p className="unlock-text unlock-text-4 mt-3 text-sm text-neutral-300">
            {celebration.note}
          </p>
        )}
      </div>
    </div>
  );
}
