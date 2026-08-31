import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type SectionHeadingProps = {
  title: ReactNode
  description?: ReactNode
  align?: 'start' | 'center'
  tone?: 'default' | 'inverted'
  className?: string
}

export function SectionHeading({
  title,
  description,
  align = 'start',
  tone = 'default',
  className,
}: SectionHeadingProps) {
  const isInverted = tone === 'inverted'

  return (
    <div className={cn('flex max-w-2xl flex-col', align === 'center' && 'mx-auto items-center text-center', className)}>
      <h2
        className={cn(
          'text-3xl font-semibold tracking-[-0.045em] text-balance sm:text-4xl lg:text-5xl',
          isInverted && 'text-white',
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            'mt-4 text-base leading-7 text-pretty sm:text-lg sm:leading-8',
            isInverted ? 'text-white/60' : 'text-muted-foreground',
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  )
}
