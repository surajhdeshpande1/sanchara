import { Users } from 'lucide-react'
import { useT } from '../lib/i18n'
import type { CrowdEstimate } from '../engine/types'

export function CrowdBadge({ crowd, compact }: { crowd: CrowdEstimate; compact?: boolean }) {
  const { t } = useT()
  let lvl = crowd.level || 'low'
  if (lvl === ('quiet' as any)) lvl = 'low'
  if (lvl === ('normal' as any)) lvl = 'moderate'
  if (lvl === ('busy' as any)) lvl = 'high'
  if (lvl === ('packed' as any)) lvl = 'very_high'

  const isHigh = lvl === 'high' || lvl === 'very_high'
  const isVHigh = lvl === 'very_high'
  const isMod = lvl === 'moderate'
  const isLow = lvl === 'low'
  
  let bg = 'bg-hatti-200'
  let text = 'text-kallu-700'
  let fill = 'bg-kallu-700'
  
  if (isVHigh) { bg = 'bg-kempu-700'; text = 'text-hatti-50'; fill = 'bg-hatti-50' }
  else if (isHigh) { bg = 'bg-kempu-100'; text = 'text-kempu-800'; fill = 'bg-kempu-800' }
  else if (isMod) { bg = 'bg-arishina-100'; text = 'text-arishina-700'; fill = 'bg-arishina-700' }
  else if (isLow) { bg = 'bg-hasiru-100'; text = 'text-hasiru-900'; fill = 'bg-hasiru-900' }

  const bars = [6, 8, 10, 12]
  const activeCount = isVHigh ? 4 : isHigh ? 3 : isMod ? 2 : 1

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 min-h-9 ${bg} ${text}`} title={t('crowd.note' as any)}>
      <Users className="w-4 h-4 shrink-0" />
      {!compact && <span className="text-[13px] font-medium leading-none">{t('crowd.label' as any)}:</span>}
      <span className="text-[13px] font-medium leading-none">{t(`crowd.${lvl}` as any)}</span>
      <div className="flex items-end gap-[2px] ml-1 h-3">
        {bars.map((h, i) => (
          <div key={i} className={`w-1 rounded-sm ${i < activeCount ? fill : 'bg-current opacity-20'}`} style={{ height: h }} />
        ))}
      </div>
      <span className="text-[11px] font-bold leading-none opacity-80 ml-0.5">{crowd.score}</span>
    </div>
  )
}
