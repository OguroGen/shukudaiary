import { getProblemType } from '@/lib/problem-types'

export function generateDivisionQuestion(parameters) {
  const typeDef = getProblemType('div')
  const param1 = parameters?.parameter1 ?? typeDef.parameters.parameter1.default // 除数の桁数
  const param2 = parameters?.parameter2 ?? typeDef.parameters.parameter2.default // 商の桁数
  
  const divisorMin = Math.pow(10, param1 - 1) + 1
  const divisorMax = Math.pow(10, param1) - 1
  const quotientMin = Math.pow(10, param2 - 1) + 1
  const quotientMax = Math.pow(10, param2) - 1

  const divisor = Math.floor(Math.random() * (divisorMax - divisorMin + 1)) + divisorMin
  const quotient = Math.floor(Math.random() * (quotientMax - quotientMin + 1)) + quotientMin
  const dividend = divisor * quotient

  return {
    type: 'div',
    dividend,
    divisor,
    answer: quotient,
  }
}

export function generateDivisionQuestions(count, parameters) {
  return Array.from({ length: count }, () =>
    generateDivisionQuestion(parameters)
  )
}

