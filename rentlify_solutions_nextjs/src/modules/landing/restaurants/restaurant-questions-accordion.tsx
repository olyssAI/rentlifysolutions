'use client'

import { ChevronDown } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { questions } from './restaurant-landing-content'

export function RestaurantQuestionsAccordion() {
  const [openQuestionIndex, setOpenQuestionIndex] = useState<number | null>(null)
  const shouldReduceMotion = useReducedMotion()

  return (
    <div className="rounded-[2rem] border border-[#e5d8e9] bg-[#fffdf8] px-5 shadow-[0_20px_60px_rgba(63,17,89,.08)] sm:px-8">
      {questions.map(({ question, answer }, questionIndex) => {
        const isQuestionOpen = openQuestionIndex === questionIndex
        const contentIdentifier = `restaurant-question-${questionIndex}`
        return (
          <div className="border-b border-[#e5d8e9] last:border-0" key={question}>
            <button
              aria-controls={contentIdentifier}
              aria-expanded={isQuestionOpen}
              className="group flex w-full items-center justify-between gap-6 py-6 text-left text-base font-black text-[#27172e] sm:text-lg"
              onClick={() => setOpenQuestionIndex(isQuestionOpen ? null : questionIndex)}
              type="button"
            >
              <span>{question}</span>
              <ChevronDown
                aria-hidden="true"
                className={`size-5 shrink-0 text-[#6f2da8] transition-transform duration-200 ${isQuestionOpen ? 'rotate-180' : ''}`}
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
                  <p className="max-w-2xl pb-6 pr-8 leading-7 text-[#75677c]">{answer}</p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
