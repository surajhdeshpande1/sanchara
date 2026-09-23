
import { Store, BadgeCheck } from 'lucide-react'
import { useT } from '../lib/i18n'
import type { Business } from '../engine/types'
import { Pill } from './ui'

export function BusinessCard({ biz, why, distanceKm }: { biz: Business; why?: string; distanceKm?: number }) {
  const { t, p } = useT()

  const isVerified = ['map_listed', 'partner_verified', 'gov_listed', 'gi_registered'].includes(biz.verification.status)
  
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-maralu-200">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-hasiru-100 text-hasiru-700 flex items-center justify-center shrink-0">
          <Store className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-kallu-900 text-base leading-tight mb-1 truncate">{p(biz.name)}</h3>
          
          <div className="mb-2">
            {biz.verification.status === 'demo' ? (
              <Pill tone="neutral">{t('biz.demo' as any)}</Pill>
            ) : isVerified ? (
              <Pill tone="green">
                <span className="flex items-center gap-1"><BadgeCheck className="w-3.5 h-3.5" />{t(`biz.${biz.verification.status}` as any)}</span>
              </Pill>
            ) : (
              <Pill tone="neutral">{t('biz.unverified' as any)}</Pill>
            )}
          </div>
          
          <div className="text-[13px] text-kallu-600 flex flex-wrap items-center gap-1.5 leading-snug">
            {biz.offers && <span>{biz.offers.map(o => p(o)).join(' · ')}</span>}
            {biz.typicalSpendINR && biz.offers && <span>·</span>}
            {biz.typicalSpendINR && <span>{t('biz.spend' as any, { amt: biz.typicalSpendINR })}</span>}
          </div>
          
          <div className="text-[13px] text-kallu-500 mt-0.5">
            {distanceKm !== undefined ? `${distanceKm.toFixed(1)} km · ` : ''}{p(biz.town)}
          </div>
          
          {why && (
            <div className="mt-2 text-[13px] font-medium text-hasiru-900">
              {why}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
