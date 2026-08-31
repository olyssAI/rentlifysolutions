import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

type SectionNavigationState = { scrollToSection?: string }

/**
 * Scrolls to the element named by the current location hash.
 * The browser only does this for full page loads, not for client-side navigation.
 */
export function useHashScroll() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const sectionId = (location.state as SectionNavigationState | null)?.scrollToSection
    if (!sectionId) {
      return
    }

    const target = document.getElementById(sectionId)

    if (target) {
      target.scrollIntoView({ behavior: 'smooth' })
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location.pathname, location.state, navigate])
}
