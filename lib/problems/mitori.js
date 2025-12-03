export function generateMitoriQuestion(digitsPerRow, rowCount) {
  const numbers = []
  const min = Math.pow(10, digitsPerRow - 1)
  const max = Math.pow(10, digitsPerRow) - 1

  for (let i = 0; i < rowCount; i++) {
    const num = Math.floor(Math.random() * (max - min + 1)) + min
    numbers.push(num)
  }

  const answer = numbers.reduce((sum, num) => sum + num, 0)

  return {
    type: 'mitori',
    numbers,
    answer,
  }
}

export function generateMitoriQuestions(count, digitsPerRow, rowCount) {
  return Array.from({ length: count }, () =>
    generateMitoriQuestion(digitsPerRow, rowCount)
  )
}

