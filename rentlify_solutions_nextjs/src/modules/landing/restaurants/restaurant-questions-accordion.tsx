'use client'

import { ChevronDown } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { questions } from './restaurant-landing-content'

export function RestaurantQuestionsAccordion() {
  const [openQuestionIndex, setOpenQuestionIndex] = useState<number | null>(null)
  const shouldReduceMotion = useReducedMotion()

  return (
    <div className="rounded-2xl border border-[#e7ddd4] bg-white px-6">
      {questions.map(({ question, answer }, questionIndex) => {
        const isQuestionOpen = openQuestionIndex === questionIndex
        const contentIdentifier = `restaurant-question-${questionIndex}`
        return (
          <div className="border-b border-[#e7ddd4] last:border-0" key={question}>
            <button
              aria-controls={contentIdentifier}
              aria-expanded={isQuestionOpen}
              className="group flex w-full items-center justify-between gap-6 py-5 text-left text-base font-medium"
              onClick={() => setOpenQuestionIndex(isQuestionOpen ? null : questionIndex)}
              type="button"
            >
              <span>{question}</span>
              <ChevronDown
                aria-hidden="true"
                className={`size-5 shrink-0 text-[#746b66] transition-transform duration-200 group-hover:text-[#dc3b2f] ${isQuestionOpen ? 'rotate-180' : ''}`}
              />
            </button>
            <AnimatePresence initial={false}>
              {isQuestionOpen ? (
                <motion.div
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  id={contentIdentifier}
                  initial={shouldReduceMotion ? false : { height: 0, opacity: 0 }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
                >
                  <p className="pb-5 pr-8 leading-7 text-[#746b66]">{answer}</p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
