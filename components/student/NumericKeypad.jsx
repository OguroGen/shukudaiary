'use client'

import { memo } from 'react'

function NumericKeypad({
  onNumberClick,
  onClear,
  onSubmit,
  disabled = false,
  submitDisabled = false,
}) {
  // テンキーの並び: 7-8-9, 4-5-6, 1-2-3
  const numbers = [7, 8, 9, 4, 5, 6, 1, 2, 3]

  const buttonColors = [
    'bg-cyan-300 hover:bg-cyan-400 active:bg-cyan-500',  // 7
    'bg-lime-300 hover:bg-lime-400 active:bg-lime-500',  // 8
    'bg-amber-300 hover:bg-amber-400 active:bg-amber-500', // 9
    'bg-blue-300 hover:bg-blue-400 active:bg-blue-500',   // 4
    'bg-green-300 hover:bg-green-400 active:bg-green-500', // 5
    'bg-purple-300 hover:bg-purple-400 active:bg-purple-500', // 6
    'bg-yellow-300 hover:bg-yellow-400 active:bg-yellow-500', // 1
    'bg-pink-300 hover:bg-pink-400 active:bg-pink-500',   // 2
    'bg-orange-300 hover:bg-orange-400 active:bg-orange-500', // 3
  ]

  return (
    <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto">
      {numbers.map((num, idx) => (
        <button
          key={num}
          onClick={() => onNumberClick(num)}
          disabled={disabled}
          className={`aspect-square ${buttonColors[idx]} rounded-xl text-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-md transform hover:scale-110 active:scale-95 transition-transform border-2 border-white`}
        >
          {num}
        </button>
      ))}
      <button
        onClick={onClear}
        disabled={disabled}
        className="aspect-square bg-red-400 hover:bg-red-500 active:bg-red-600 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-md transform hover:scale-110 active:scale-95 transition-transform border-2 border-white text-base"
      >
        🗑️ C
      </button>
      <button
        onClick={() => onNumberClick(0)}
        disabled={disabled}
        className="aspect-square bg-yellow-300 hover:bg-yellow-400 active:bg-yellow-500 rounded-xl text-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-md transform hover:scale-110 active:scale-95 transition-transform border-2 border-white"
      >
        0
      </button>
      <button
        onClick={onSubmit}
        disabled={disabled || submitDisabled}
        className="aspect-square bg-green-400 hover:bg-green-500 active:bg-green-600 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-md transform hover:scale-110 active:scale-95 transition-transform border-2 border-white text-base"
      >
        ✓ OK
      </button>
    </div>
  )
}

export default memo(NumericKeypad)

