import { getProblemType } from '@/lib/problem-types'

export function generateMultiplicationQuestion(parameters) {
  const typeDef = getProblemType('mul')
  const param1 = parameters?.parameter1 ?? typeDef.parameters.parameter1.default
  const param2 = parameters?.parameter2 ?? typeDef.parameters.parameter2.default
  
  const leftMin = Math.pow(10, param1 - 1)
  const leftMax = Math.pow(10, param1) - 1
  const rightMin = Math.pow(10, param2 - 1)
  const rightMax = Math.pow(10, param2) - 1

  const left = Math.floor(Math.random() * (leftMax - leftMin + 1)) + leftMin
  const right = Math.floor(Math.random() * (rightMax - rightMin + 1)) + rightMin

  return {
    type: 'mul',
    left,
    right,
    answer: left * right,
  }
}

export function generateMultiplicationQuestions(count, parameters) {
  return Array.from({ length: count }, () =>
    generateMultiplicationQuestion(parameters)
  )
}

