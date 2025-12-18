import { getProblemType } from '@/lib/problem-types'

export function generateMitoriQuestion(parameters) {
  const typeDef = getProblemType('mitori')
  const param1 = parameters?.parameter1 ?? typeDef.parameters.parameter1.default
  const param2 = parameters?.parameter2 ?? typeDef.parameters.parameter2.default
  
  const numbers = []
  const min = Math.pow(10, param1 - 1)
  const max = Math.pow(10, param1) - 1

  for (let i = 0; i < param2; i++) {
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

export function generateMitoriQuestions(count, parameters) {
  return Array.from({ length: count }, () =>
    generateMitoriQuestion(parameters)
  )
}

