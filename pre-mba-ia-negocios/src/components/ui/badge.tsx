import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';

import { cn } from '@/lib/cn.ts';

/** shadcn/ui Badge, adapted to the project tokens. */
const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap [&_svg]:size-3.5 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        brand: 'bg-brand-50 text-brand-700 ring-1 ring-brand-100',
        neutral: 'bg-neutral-100 text-neutral-600',
        solid: 'bg-brand-700 text-white',
      },
      size: {
        sm: 'px-2.5 py-1 text-[11px] tracking-wide uppercase',
        md: 'px-3.5 py-1.5 text-sm',
      },
    },
    defaultVariants: { variant: 'brand', size: 'md' },
  },
);

type BadgeProps = ComponentProps<'span'> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}
