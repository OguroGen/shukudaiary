'use client'

import { PLANS, getPlanDisplayName } from '@/lib/plans'

export default function PlanSelector({ selectedPlan, onPlanChange }) {
  const availablePlans = ['free'] // 現在利用可能なプラン
  const comingSoonPlans = ['basic', 'standard', 'premium'] // 開発中のプラン

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium mb-2">プランを選択</label>
      
      {/* 利用可能なプラン */}
      <div className="space-y-2">
        {availablePlans.map((planId) => {
          const plan = PLANS[planId]
          return (
            <label
              key={planId}
              className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                selectedPlan === planId
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input
                type="radio"
                name="plan"
                value={planId}
                checked={selectedPlan === planId}
                onChange={(e) => onPlanChange(e.target.value)}
                className="mt-1 mr-3"
              />
              <div className="flex-1">
                <div className="font-semibold text-lg">
                  {getPlanDisplayName(planId)}
                  {plan.price > 0 && (
                    <span className="text-sm font-normal text-gray-600 ml-2">
                      ¥{plan.price.toLocaleString()}/月
                    </span>
                  )}
                </div>
                <ul className="text-sm text-gray-600 mt-1 space-y-1">
                  {plan.features.map((feature, idx) => (
                    <li key={idx}>• {feature}</li>
                  ))}
                </ul>
              </div>
            </label>
          )
        })}
      </div>

      {/* 開発中のプラン */}
      {comingSoonPlans.length > 0 && (
        <div className="space-y-2 pt-4 border-t">
          <div className="text-sm font-medium text-gray-500 mb-2">開発中</div>
          {comingSoonPlans.map((planId) => {
            const plan = PLANS[planId]
            return (
              <div
                key={planId}
                className="flex items-start p-4 border-2 rounded-lg bg-gray-100 dark:bg-gray-800 border-gray-300 opacity-60"
              >
                <div className="flex-1">
                  <div className="font-semibold text-lg flex items-center gap-2">
                    {getPlanDisplayName(planId)}
                    {plan.price > 0 && (
                      <span className="text-sm font-normal text-gray-600">
                        ¥{plan.price.toLocaleString()}/月
                      </span>
                    )}
                    <span className="px-2 py-1 text-xs font-semibold bg-yellow-400 text-yellow-900 rounded">
                      開発中
                    </span>
                  </div>
                  <ul className="text-sm text-gray-600 mt-1 space-y-1">
                    {plan.features.map((feature, idx) => (
                      <li key={idx}>• {feature}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

