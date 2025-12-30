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
    name: '見取り算',
    emoji: '➕',
    parameters: {
      parameter1: {
        label: '桁数',
        required: true,
        min: 1,
        max: 10,
        default: 3,
        type: 'integer',
      },
      parameter2: {
        label: '行数',
        required: true,
        min: 2,
        max: 10,
        default: 4,
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

/**
 * 既存データとの後方互換性のため、parametersがない場合は旧カラムから取得
 * @param {object} homework - homeworkまたはpresetオブジェクト
 * @returns {object} parametersオブジェクト
 */
export function getParameters(homework) {
  // 既にparameter1がある場合はそのまま返す
  if (homework.parameter1 !== null && homework.parameter1 !== undefined) {
    return {
      parameter1: homework.parameter1,
      parameter2: homework.parameter2,
      parameter3: homework.parameter3,
      parameter4: homework.parameter4,
      parameter5: homework.parameter5,
      parameter6: homework.parameter6,
      parameter7: homework.parameter7,
      parameter8: homework.parameter8,
      parameter9: homework.parameter9,
      parameter10: homework.parameter10,
    }
  }
  
  // parametersを生成
  const parameters = {}
  for (let i = 1; i <= 10; i++) {
    parameters[`parameter${i}`] = homework[`parameter${i}`] || null
  }
  
  return parameters
}

