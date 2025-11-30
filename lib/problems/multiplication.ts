export interface MultiplicationQuestion {
  type: 'mul'
  left: number
  right: number
  answer: number
}

export function generateMultiplicationQuestion(
  leftDigits: number,
  rightDigits: number
): MultiplicationQuestion {
  const leftMin = Math.pow(10, leftDigits - 1)
  const leftMax = Math.pow(10, leftDigits) - 1
  const rightMin = Math.pow(10, rightDigits - 1)
  const rightMax = Math.pow(10, rightDigits) - 1

  const left = Math.floor(Math.random() * (leftMax - leftMin + 1)) + leftMin
  const right = Math.floor(Math.random() * (rightMax - rightMin + 1)) + rightMin

  return {
    type: 'mul',
    left,
    right,
    answer: left * right,
  }
}

export function generateMultiplicationQuestions(
  count: number,
  leftDigits: number,
  rightDigits: number
): MultiplicationQuestion[] {
  return Array.from({ length: count }, () =>
    generateMultiplicationQuestion(leftDigits, rightDigits)
  )
}

