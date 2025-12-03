export function generateDivisionQuestion(leftDigits, rightDigits) {
  // Generate a multiplication problem first, then reverse it
  const leftMin = Math.pow(10, leftDigits - 1)
  const leftMax = Math.pow(10, leftDigits) - 1
  const rightMin = Math.pow(10, rightDigits - 1)
  const rightMax = Math.pow(10, rightDigits) - 1

  const divisor = Math.floor(Math.random() * (rightMax - rightMin + 1)) + rightMin
  const quotient = Math.floor(Math.random() * (leftMax - leftMin + 1)) + leftMin
  const dividend = divisor * quotient

  return {
    type: 'div',
    dividend,
    divisor,
    answer: quotient,
  }
}

export function generateDivisionQuestions(count, leftDigits, rightDigits) {
  return Array.from({ length: count }, () =>
    generateDivisionQuestion(leftDigits, rightDigits)
  )
}

