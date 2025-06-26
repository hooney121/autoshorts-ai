"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, HelpCircle } from 'lucide-react'

interface AccordionProps {
  question: string
  answer: React.ReactNode
}

export const Accordion = ({ question, answer }: AccordionProps) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <motion.div 
      className="group border border-slate-200 rounded-xl overflow-hidden bg-white hover:shadow-md transition-all duration-300 hover:border-slate-300"
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 flex justify-between items-center text-left hover:bg-slate-50 transition-colors duration-200"
      >
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
            <HelpCircle className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 group-hover:text-red-600 transition-colors duration-200">
            {question}
          </h3>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="flex-shrink-0 ml-4"
        >
          <ChevronDown className="h-6 w-6 text-slate-500 group-hover:text-red-500 transition-colors duration-200" />
        </motion.div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-2">
              <div className="pl-14 text-slate-600 leading-relaxed text-base">
                {answer}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
} 