'use client'

import { memo } from 'react'

function QuestionDisplay({ type, question, currentAnswer }) {
  if (type === 'mul' || type === 'div') {
    return (
      <div className="text-center py-12 bg-yellow-50 rounded-3xl p-8 border-4 border-yellow-200">
        <div className="text-6xl font-bold mb-6 text-gray-800">
          {type === 'mul' ? (
            <>
              <span className="text-orange-500">{question.left}</span>
              <span className="text-gray-600 mx-4">×</span>
              <span className="text-blue-500">{question.right}</span>
              <span className="text-gray-600 mx-4">=</span>
              <span className="text-green-600 bg-white px-4 py-2 rounded-2xl border-4 border-green-300 inline-block min-w-[200px]">
                {currentAnswer || '?'}
              </span>
            </>
          ) : (
            <>
              <span className="text-orange-500">{question.dividend}</span>
              <span className="text-gray-600 mx-4">÷</span>
              <span className="text-blue-500">{question.divisor}</span>
              <span className="text-gray-600 mx-4">=</span>
              <span className="text-green-600 bg-white px-4 py-2 rounded-2xl border-4 border-green-300 inline-block min-w-[200px]">
                {currentAnswer || '?'}
              </span>
            </>
          )}
        </div>
      </div>
    )
  }

  // Mitori
  return (
    <div className="text-center py-12 bg-yellow-50 rounded-3xl p-8 border-4 border-yellow-200">
      <div className="text-5xl font-bold mb-6 text-gray-800 space-y-4">
        {question.numbers?.map((num, idx) => (
          <div key={idx} className="text-right pr-12">
            {idx === 0 ? '' : <span className="text-gray-600 mx-2">+</span>}
            <span className="text-orange-500">{num}</span>
          </div>
        ))}
        <div className="border-t-4 border-gray-400 pt-4 mt-4">
          <span className="text-green-600 bg-white px-4 py-2 rounded-2xl border-4 border-green-300 inline-block min-w-[200px]">
            {currentAnswer || '?'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default memo(QuestionDisplay)

