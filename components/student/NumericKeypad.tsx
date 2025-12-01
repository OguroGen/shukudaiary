'use client'

import { memo } from 'react'

interface NumericKeypadProps {
  onNumberClick: (num: number) => void
  onClear: () => void
  onSubmit: () => void
  disabled?: boolean
}

function NumericKeypad({
  onNumberClick,
  onClear,
  onSubmit,
  disabled = false,
}: NumericKeypadProps) {
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9]

  return (
    <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
      {numbers.map((num) => (
        <button
          key={num}
          onClick={() => onNumberClick(num)}
          disabled={disabled}
          className="aspect-square bg-gray-200 hover:bg-gray-300 active:bg-gray-400 rounded-lg text-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {num}
        </button>
      ))}
      <button
        onClick={onClear}
        disabled={disabled}
        className="aspect-square bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        C
      </button>
      <button
        onClick={() => onNumberClick(0)}
        disabled={disabled}
        className="aspect-square bg-gray-200 hover:bg-gray-300 active:bg-gray-400 rounded-lg text-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        0
      </button>
      <button
        onClick={onSubmit}
        disabled={disabled}
        className="aspect-square bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        OK
      </button>
    </div>
  )
}

export default memo(NumericKeypad)

