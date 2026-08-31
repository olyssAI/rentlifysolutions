import type { ButtonHTMLAttributes, MouseEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

type SectionNavigationButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  sectionId: string
}

export function SectionNavigationButton({
  sectionId,
  onClick,
  type = 'button',
  ...props
}: SectionNavigationButtonProps) {
  const location = useLocation()
  const navigate = useNavigate()

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event)
    if (event.defaultPrevented) return

    if (location.pathname === '/') {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' })
      return
    }

    navigate('/', { state: { scrollToSection: sectionId } })
  }

  return <button type={type} onClick={handleClick} {...props} />
}
