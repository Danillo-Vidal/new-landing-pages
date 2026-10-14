import type { ComponentProps } from 'react';

import { cn } from '@/lib/cn.ts';

/** shadcn/ui Skeleton. Decorative: hidden from assistive technology. */
export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-xl bg-neutral-200/70', className)}
      {...props}
    />
  );
}
