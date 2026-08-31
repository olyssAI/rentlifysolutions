import { Utensils } from 'lucide-react'

import { cn } from '@/lib/utils'

type BrandMarkProps = {
  size?: 'default' | 'lg'
  className?: string
}

export function BrandMark({ size = 'default', className }: BrandMarkProps) {
  const isLarge = size === 'lg'

  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span
        className={cn(
          'grid shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground',
          isLarge ? 'size-11' : 'size-9',
        )}
      >
        <Utensils className={isLarge ? 'size-5' : 'size-4'} aria-hidden="true" />
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            'font-heading font-bold tracking-[-0.03em] text-foreground',
            isLarge ? 'text-xl' : 'text-[1.05rem]',
          )}
        >
          Rentlify
        </span>
        <span
          className={cn(
            'mt-1 font-medium tracking-[0.22em] text-muted-foreground uppercase',
            isLarge ? 'text-[0.65rem]' : 'text-[0.58rem]',
          )}
        >
          Solutions
        </span>
      </span>
    </span>
  )
}
