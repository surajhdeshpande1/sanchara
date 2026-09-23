import { BadgeCheck, ExternalLink } from 'lucide-react'
import { useT } from '../lib/i18n'
import { useData } from '../lib/data'
import { Sheet } from './ui'
import { useState } from 'react'

export function SourceChip({ sourceIds }: { sourceIds: string[] }) {
  const { t, p } = useT()
  const { sourceById } = useData()
  const [open, setOpen] = useState(false)

  if (!sourceIds?.length) return null

  const sources = sourceIds.map(id => sourceById.get(id)).filter(Boolean) as any[]
  if (!sources.length) return null
  
  sources.sort((a, b) => a.tier.localeCompare(b.tier))
  const best = sources[0]

  return (
    <>
      <button 
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-9 rounded-full bg-hasiru-100 text-hasiru-900 active:scale-[0.97] touch-manipulation transition-transform"
      >
        <BadgeCheck className="w-4 h-4 text-hasiru-700 shrink-0" />
        <span className="text-[13px] font-medium leading-none">
          {p(best.publisher)} · {t('common.tier' as any, { t: best.tier.replace('Tier ', '') })}
        </span>
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title={t('ask.sources' as any)}>
        <div className="space-y-4 pt-2">
          {sources.map(src => {
            const host = new URL(src.url).hostname.replace('www.', '')
            return (
              <div key={src.id} className="bg-hatti-50 rounded-xl p-4 border border-maralu-200 shadow-sm">
                <h4 className="font-semibold text-kallu-900 mb-1 leading-snug">{p(src.title)}</h4>
                <div className="text-[13px] text-kallu-600 mb-3 flex flex-wrap gap-x-2 gap-y-1">
                  <span className="font-medium text-hasiru-800">{p(src.publisher)}</span>
                  <span>·</span>
                  <span>{t('common.tier' as any, { t: src.tier.replace('Tier ', '') })}</span>
                </div>
                <a 
                  href={src.url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-[13px] font-medium text-neeli-700 active:text-neeli-900 touch-manipulation p-2 -ml-2 rounded-lg"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {host}
                </a>
              </div>
            )
          })}
        </div>
      </Sheet>
    </>
  )
}
