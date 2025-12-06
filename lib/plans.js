/**
 * プラン定義
 * 各プランの制限値を定義
 * 
 * TODO: 将来の実装予定
 * - プラン変更時の制限チェック機能
 *   - ダウングレード時に制限を満たしていない場合、プラン変更を拒否
 *   - 制限超過分のデータを自動削除する機能（オプション）
 *   - プラン変更APIエンドポイントの作成
 *   - プラン変更UIの実装
 */

export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    emoji: '🆓',
    price: 0,
    limits: {
      maxStudents: 10,
      maxPresets: 10,
      dataRetentionDays: 90,
    },
    features: [
      '生徒数: 10人',
      'プリセット: 10件',
      '結果保存: 90日',
      'メッセージ: なし',
    ],
  },
  basic: {
    id: 'basic',
    name: 'Basic',
    emoji: '🔰',
    price: 2000,
    limits: {
      maxStudents: 30,
      maxPresets: 30,
      dataRetentionDays: null, // 無期限
    },
    features: [
      '生徒数: 30人',
      'プリセット: 30件',
      '結果保存: 無期限',
      'メッセージ: なし',
    ],
  },
  standard: {
    id: 'standard',
    name: 'Standard',
    emoji: '🏫',
    price: 5000,
    limits: {
      maxStudents: 100,
      maxPresets: 100,
      dataRetentionDays: null, // 無期限
    },
    features: [
      '生徒数: 100人',
      'プリセット: 100件',
      '結果保存: 無期限',
      'メッセージ: 個別送信のみ',
    ],
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    emoji: '👑',
    price: 9800,
    limits: {
      maxStudents: null, // 無制限
      maxPresets: null, // 無制限
      dataRetentionDays: null, // 無期限
    },
    features: [
      '生徒数: 無制限',
      'プリセット: 無制限',
      '結果保存: 無期限',
      'メッセージ: 個別＋一斉送信（将来）',
      '教場（複数教室）管理',
    ],
  },
}

/**
 * プランIDからプラン情報を取得
 * @param {string} planId - プランID
 * @returns {object|null} プラン情報、存在しない場合はnull
 */
export function getPlan(planId) {
  return PLANS[planId] || PLANS.free // デフォルトはFreeプラン
}

/**
 * プランの制限値を取得
 * @param {string} planId - プランID
 * @returns {object} 制限値オブジェクト
 */
export function getPlanLimits(planId) {
  const plan = getPlan(planId)
  return plan.limits
}

/**
 * 生徒数の制限チェック
 * @param {string} planId - プランID
 * @param {number} currentCount - 現在の生徒数
 * @returns {boolean} 制限内の場合はtrue
 */
export function checkStudentLimit(planId, currentCount) {
  const limits = getPlanLimits(planId)
  if (limits.maxStudents === null) {
    return true // 無制限
  }
  return currentCount < limits.maxStudents
}

/**
 * プリセット数の制限チェック
 * @param {string} planId - プランID
 * @param {number} currentCount - 現在のプリセット数
 * @returns {boolean} 制限内の場合はtrue
 */
export function checkPresetLimit(planId, currentCount) {
  const limits = getPlanLimits(planId)
  if (limits.maxPresets === null) {
    return true // 無制限
  }
  return currentCount < limits.maxPresets
}

/**
 * プラン名を取得（絵文字付き）
 * @param {string} planId - プランID
 * @returns {string} プラン名
 */
export function getPlanDisplayName(planId) {
  const plan = getPlan(planId)
  return `${plan.emoji} ${plan.name}`
}

/**
 * エラーメッセージを生成
 * @param {string} planId - プランID
 * @param {string} type - 'students' または 'presets'
 * @param {number} currentCount - 現在の数
 * @returns {string} エラーメッセージ
 */
export function getLimitErrorMessage(planId, type, currentCount) {
  const plan = getPlan(planId)
  const limits = getPlanLimits(planId)
  
  if (type === 'students') {
    if (limits.maxStudents === null) {
      return null // 無制限の場合はエラーなし
    }
    return `${getPlanDisplayName(planId)}では${limits.maxStudents}人まで登録できます（現在: ${currentCount}人）`
  } else if (type === 'presets') {
    if (limits.maxPresets === null) {
      return null // 無制限の場合はエラーなし
    }
    return `${getPlanDisplayName(planId)}では${limits.maxPresets}件まで登録できます（現在: ${currentCount}件）`
  }
  
  return null
}

