'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function PathnameChangeScrollRestoration() {
  const currentPathname = usePathname()

  useEffect(() => {
    const animationFrameIdentifier = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    })

    return () => window.cancelAnimationFrame(animationFrameIdentifier)
  }, [currentPathname])

  return null
}
