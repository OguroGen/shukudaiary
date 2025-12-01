'use client'

import { memo } from 'react'
import { HomeworkType } from '@/types/homework'

interface QuestionDisplayProps {
  type: HomeworkType
  question: {
    type: HomeworkType
    left?: number
    right?: number
    dividend?: number
    divisor?: number
    numbers?: number[]
    answer?: number
  }
  currentAnswer: string
}

function QuestionDisplay({
  type,
  question,
  currentAnswer,
}: QuestionDisplayProps) {
  if (type === 'mul' || type === 'div') {
    return (
      <div className="text-center py-8">
        <div className="text-4xl font-mono mb-4">
          {type === 'mul' ? (
            <>
              {question.left} × {question.right} = [ {currentAnswer || '      '} ]
            </>
          ) : (
            <>
              {question.dividend} ÷ {question.divisor} = [ {currentAnswer || '      '} ]
            </>
          )}
        </div>
      </div>
    )
  }

  // Mitori
  return (
    <div className="text-center py-8">
      <div className="text-3xl font-mono mb-4 space-y-2">
        {question.numbers?.map((num, idx) => (
          <div key={idx} className="text-right pr-8">
            {idx === 0 ? '' : '+'} {num}
          </div>
        ))}
        <div className="border-t-2 border-gray-800 pt-2 mt-2">
          [ {currentAnswer || '      '} ]
        </div>
      </div>
    </div>
  )
}

export default memo(QuestionDisplay)

