'use client'

import { memo } from 'react'
import { formatNumber } from '@/lib/utils/format'

function QuestionDisplay({ type, question, currentAnswer }) {
  if (type === 'mul' || type === 'div') {
    return (
      <div className="text-center py-4 bg-yellow-50 rounded-xl p-3 border-2 border-yellow-200 mb-3">
        <div className="text-2xl font-bold mb-3 text-gray-800">
          {type === 'mul' ? (
            <>
              <span className="text-orange-500">{formatNumber(question.left)}</span>
              <span className="text-gray-600 mx-2">×</span>
              <span className="text-blue-500">{formatNumber(question.right)}</span>
              <span className="text-gray-600 mx-2">=</span>
              <span className="text-green-600 bg-white px-2 py-1 rounded-xl border-2 border-green-300 inline-block min-w-[120px]">
                {currentAnswer ? formatNumber(currentAnswer) : '?'}
              </span>
            </>
          ) : (
            <>
              <span className="text-orange-500">{formatNumber(question.dividend)}</span>
              <span className="text-gray-600 mx-2">÷</span>
              <span className="text-blue-500">{formatNumber(question.divisor)}</span>
              <span className="text-gray-600 mx-2">=</span>
              <span className="text-green-600 bg-white px-2 py-1 rounded-xl border-2 border-green-300 inline-block min-w-[120px]">
                {currentAnswer ? formatNumber(currentAnswer) : '?'}
              </span>
            </>
          )}
        </div>
      </div>
    )
  }

  // Mitori
  return (
    <div className="text-center py-4 bg-yellow-50 rounded-xl p-3 border-2 border-yellow-200 mb-3">
      <div className="text-xl font-bold mb-3 text-gray-800 space-y-0">
        {question.numbers?.map((num, idx) => {
          const isNegative = num < 0
          const absoluteValue = Math.abs(num)
          return (
            <div key={idx} className="text-right pr-6 leading-tight">
              {isNegative && (
                <span className="text-gray-600 mx-1">-</span>
              )}
              <span className="text-orange-500">{formatNumber(absoluteValue)}</span>
            </div>
          )
        })}
        <div className="border-t-2 border-gray-400 pt-1 mt-1">
          <span className="text-green-600 bg-white px-2 py-1 rounded-xl border-2 border-green-300 inline-block min-w-[120px]">
            {currentAnswer ? formatNumber(currentAnswer) : '?'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default memo(QuestionDisplay)

