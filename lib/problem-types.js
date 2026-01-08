/**
 * 種目ごとのパラメーター定義
 * 各種目でどのパラメーターをどう使うかを定義
 */
export const PROBLEM_TYPES = {
  mul: {
    name: 'かけ算',
    emoji: '✖️',
    parameters: {
      parameter1: {
        label: 'かけられる数（実）の桁数',
        required: true,
        min: 1,
        max: 10,
        default: 2,
        type: 'integer',
      },
      parameter2: {
        label: 'かける数（法）の桁数',
        required: true,
        min: 1,
        max: 10,
        default: 1,
        type: 'integer',
      },
    },
  },
  div: {
    name: 'わり算',
    emoji: '➗',
    parameters: {
      parameter1: {
        label: '割る数（除数）の桁数',
        required: true,
        min: 1,
        max: 10,
        default: 1,
        type: 'integer',
      },
      parameter2: {
        label: '答え（商）の桁数',
        required: true,
        min: 1,
        max: 10,
        default: 2,
        type: 'integer',
      },
    },
  },
  mitori: {
    name: '見取算',
    emoji: '➕',
    parameters: {
      parameter1: {
        label: '桁数',
        required: true,
        min: 1,
        max: 10,
        default: 2,
        type: 'integer',
      },
      parameter2: {
        label: '口数',
        required: true,
        min: 2,
        max: 10,
        default: 5,
        type: 'integer',
      },
    },
  },
}

/**
 * 種目タイプからパラメーター定義を取得
 */
export function getProblemType(type) {
  return PROBLEM_TYPES[type] || null
}

/**
 * 種目タイプから使用するパラメーターのリストを取得
 */
export function getUsedParameters(type) {
  const problemType = getProblemType(type)
  if (!problemType) return []
  return Object.keys(problemType.parameters)
}

/**
 * パラメーターのデフォルト値を取得
 */
export function getDefaultParameters(type) {
  const problemType = getProblemType(type)
  if (!problemType) return {}
  
  const defaults = {}
  Object.entries(problemType.parameters).forEach(([key, config]) => {
    defaults[key] = config.default
  })
  
  return defaults
}

/**
 * パラメーターの表示用ラベルを取得
 */
export function getParameterLabel(type, parameterKey) {
  const problemType = getProblemType(type)
  if (!problemType) return parameterKey
  return problemType.parameters[parameterKey]?.label || parameterKey
}

/**
 * 種目名を取得
 */
export function getTypeName(type) {
  const problemType = getProblemType(type)
  return problemType?.name || type
}

/**
 * 種目の絵文字を取得
 */
export function getTypeEmoji(type) {
  const problemType = getProblemType(type)
  return problemType?.emoji || '📝'
}

/**
 * パラメーターの詳細表示用テキストを生成
 */
export function formatParameters(type, homework) {
  const problemType = getProblemType(type)
  if (!problemType) return ''
  
  const parts = []
  Object.entries(problemType.parameters).forEach(([key, config]) => {
    const value = homework[key]
    if (value !== null && value !== undefined) {
      parts.push(`${config.label}: ${value}`)
    }
  })
  
  return parts.join(', ')
}

