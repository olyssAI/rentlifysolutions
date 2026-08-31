'use client'

import { motion, useReducedMotion } from 'motion/react'
import type { ComponentProps, PropsWithChildren } from 'react'

type RevealProps = PropsWithChildren<{ className?: string; delay?: number; id?: string }>

export function Reveal({ children, className, delay = 0, id }: RevealProps) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.div
      className={className}
      id={id}
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      viewport={{ once: true, amount: 0.18 }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      {children}
    </motion.div>
  )
}

export function Stagger({ children, className }: PropsWithChildren<{ className?: string }>) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : 'hidden'}
      variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      viewport={{ once: true, amount: 0.15 }}
      whileInView="visible"
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className }: ComponentProps<typeof motion.article>) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.article
      className={className}
      variants={
        reduceMotion
          ? undefined
          : {
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
            }
      }
    >
      {children}
    </motion.article>
  )
}
