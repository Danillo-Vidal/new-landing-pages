import { ArrowUpRight, Gift } from 'lucide-react';

import { uiText } from '@/content/ui-text.ts';
import type { Reward } from '@/domain/types.ts';
import { cn } from '@/lib/cn.ts';

const CTA_CLASS =
  'relative flex w-full items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-center text-xs font-semibold';

interface RewardCardProps {
  readonly reward: Reward;
  readonly isAwaitingReveal: boolean;
  readonly isRevealing: boolean;
  readonly onRevealEnd: () => void;
}

/**
 * 6th card of the journey ("Desconto desbloqueado!"). Same structure, height and radius as the
 * lesson cards, but it is NOT a lesson: not selectable, outside the progress.
 */
export function RewardCard({
  reward,
  isAwaitingReveal,
  isRevealing,
  onRevealEnd,
}: RewardCardProps) {
  const { cta } = reward;
  return (
    <article
      data-reward-card=""
      onAnimationEnd={(event) => {
        if (event.animationName === 'card-glow' || event.animationName === 'reward-fade') {
          onRevealEnd();
        }
      }}
      className={cn(
        'relative flex h-full w-full flex-col rounded-card border-2 border-reward-500 bg-linear-160 from-reward-50 to-reward-100 p-4 text-left',
        isAwaitingReveal && 'reward-awaiting',
        isRevealing && 'reward-reveal',
      )}
    >
      <span className="grid size-9 place-items-center rounded-full bg-white text-reward-600">
        <Gift aria-hidden="true" className="size-[18px]" />
      </span>
      <h3 className="mt-4 text-[15px] leading-snug font-bold tracking-[-0.01em] text-reward-700">
        {reward.title}
      </h3>
      <p className="mt-1.5 text-xs leading-relaxed text-reward-ink">{reward.description}</p>
      <span className="mt-auto block w-full pt-4">
        {cta.url ? (
          <a
            href={cta.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${cta.label} ${uiText.materials.opensInNewTab}`}
            className={cn(
              CTA_CLASS,
              'bg-reward-600 text-white transition-colors duration-200 ease-out hover:bg-reward-700',
            )}
          >
            {cta.label}
            <ArrowUpRight aria-hidden="true" className="size-3 shrink-0" />
          </a>
        ) : (
          <button
            type="button"
            disabled
            className={cn(CTA_CLASS, 'cursor-not-allowed bg-neutral-100 text-neutral-600')}
          >
            {cta.pendingLabel}
          </button>
        )}
      </span>
    </article>
  );
}
