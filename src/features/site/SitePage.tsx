import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { Clock, Route, Ticket, MapPin, Play, Square, MessageCircle, Plus } from 'lucide-react'
import { useT, LANGS } from '../../lib/i18n'
import { useData } from '../../lib/data'
import { useNow } from '../../lib/hooks'
import { useStore } from '../../state/store'
import { speak, stopSpeaking } from '../../lib/speech'
import { SiteImage } from '../../components/SiteImage'
import { CrowdBadge } from '../../components/CrowdBadge'
import { SourceChip } from '../../components/SourceChip'
import { BusinessCard } from '../../components/BusinessCard'
import { Chip, Pill } from '../../components/ui'
import { duration, inr } from '../../lib/format'
import { dayCurve, estimateCrowd } from '../../engine/crowd'
import { haversineKm } from '../../engine/geo'

function CrowdCurve({ site, now, data, overrides, reports }: any) {
  const points = dayCurve(site, data, overrides, reports)
  const w = 300, h = 60
  let path = `M 0 ${h}`
  points.forEach((p, i) => {
    const x = (i / 28) * w
    const y = h - (p.score / 100) * h
    path += ` L ${x} ${y}`
  })
  path += ` L ${w} ${h} Z`
  
  const d = new Date(now)
  const utc = now + d.getTimezoneOffset() * 60000
  const ist = new Date(utc + 330 * 60000)
  const hm = ist.getHours() * 60 + ist.getMinutes()
  
  let nowX = -10
  if (hm >= 360 && hm <= 1200) {
    nowX = ((hm - 360) / (1200 - 360)) * w
  }

  return (
    <div className="relative mt-2 mb-1 w-full aspect-[3/1] max-w-sm mx-auto">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full overflow-visible" aria-hidden="true">
        <path d={path} className="fill-kempu-700/12 stroke-kempu-700 stroke-[1.5] stroke-linejoin-round" />
        {nowX >= 0 && (
          <line x1={nowX} y1={0} x2={nowX} y2={h} className="stroke-kempu-700 stroke-1" strokeDasharray="3 3" />
        )}
      </svg>
      <div className="flex justify-between mt-1 text-[11px] text-kallu-400 font-medium px-1">
        <span>06:00</span>
        <span>09:00</span>
        <span>12:00</span>
        <span>15:00</span>
        <span>18:00</span>
      </div>
    </div>
  )
}

export function SitePage() {
  const { id } = useParams()
  const { t, lang, p } = useT()
  const navigate = useNavigate()
  const data = useData()
  const now = useNow()
  const store = useStore()
  const overrides = store.overrides
  const reports = store.reports

  const [playing, setPlaying] = useState(false)
  const [audioError, setAudioError] = useState(false)
  const [reported, setReported] = useState(false)
  
  const site = data.siteById.get(id || '')
  
  useEffect(() => {
    if (!site) return
    const hasAudio = (data as any).audio && (data as any).audio[`${site.id}.${lang}`]
    if (hasAudio && navigator.onLine) {
      fetch(`/audio/${site.id}.${lang}.mp3`).catch(() => {})
    }
    return () => stopSpeaking()
  }, [site, lang, data])

  if (!site) {
    return (
      <div className="p-8 text-center min-h-dvh flex flex-col items-center justify-center bg-hatti-50">
        <h2 className="display text-2xl text-kallu-900 mb-2">Place not found</h2>
        <p className="text-kallu-600 mb-6">This location doesn't exist in our records.</p>
        <button onClick={() => navigate('/explore')} className="px-4 py-2 min-h-12 bg-white rounded-full text-kallu-900 border border-maralu-200 active:scale-95 transition-transform touch-manipulation">
          Back to Explore
        </button>
      </div>
    )
  }

  const storyObj = data.stories.find(s => s.siteId === (site.parentId || site.id))
  const storyText = storyObj ? p(storyObj.text) : ''
  const siteFacts = data.facts.filter(f => f.siteId === site.id).sort((a, b) => a.order - b.order)

  const handleListen = () => {
    if (playing) {
      stopSpeaking()
      setPlaying(false)
      return
    }
    
    setPlaying(true)
    setAudioError(false)
    
    const hasAudio = (data as any).audio && (data as any).audio[`${site.id}.${lang}`]
    if (hasAudio) {
      const a = new Audio(`/audio/${site.id}.${lang}.mp3`)
      a.onended = () => setPlaying(false)
      a.onerror = () => {
        const ok = speak(storyText, lang, () => setPlaying(false))
        if (!ok) {
          setAudioError(true)
          setPlaying(false)
        }
      }
      a.play().catch(() => {
        const ok = speak(storyText, lang, () => setPlaying(false))
        if (!ok) {
          setAudioError(true)
          setPlaying(false)
        }
      })
    } else {
      const ok = speak(storyText, lang, () => setPlaying(false))
      if (!ok) {
        setAudioError(true)
        setPlaying(false)
      }
    }
  }

  const handleReport = (level: 'quiet'|'normal'|'busy'|'packed') => {
    store.addReport({ siteId: site.id, level, t: now, uid: 'anon', at: new Date().toISOString() } as any)
    setReported(true)
    if ((window as any).navigator?.vibrate) {
      (window as any).navigator.vibrate(50)
    }
  }

  const d = new Date(now)
  const utc = now + d.getTimezoneOffset() * 60000
  const ist = new Date(utc + 330 * 60000)
  const todayDay = ist.getDay()
  const weekdays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
  const closedToday = site.hours?.closedWeekdays?.includes(weekdays[todayDay] as any)
  const isBorder = site.scope === 'border'
  
  const plannable = data.sites.filter(s => s.plannable && s.id !== site.id)
  const nearbySites = plannable
    .map(s => ({ site: s, dist: haversineKm(site.location, s.location) }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 3)
    
  const nearbyBiz = data.businesses
    .filter(b => b.category !== 'stay')
    .map(b => ({ biz: b, dist: haversineKm(site.location, b.location) }))
    .filter(b => b.dist <= 6)
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 3)

  const crowd = estimateCrowd(site, now, data.crowd as any, overrides, reports)

  return (
    <div className="pb-24 bg-hatti-50 min-h-dvh">
      <div className="h-56 w-full">
        <SiteImage site={site} showCredit={true} className="w-full h-full object-cover" />
      </div>
      
      <div className="relative -mt-10 mx-4 bg-white rounded-2xl p-5 shadow-sm border border-maralu-200">
        <h1 className="display text-4xl leading-[0.95] text-kallu-900 mb-2" lang={lang}>{p(site.name)}</h1>
        <p className="text-kallu-600 text-[15px] leading-snug mb-5" lang={lang}>{p(site.short)}</p>
        
        <div className="grid grid-cols-2 gap-y-4 gap-x-2">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-kallu-500 text-[13px] mb-0.5">
              <Clock className="w-4 h-4" />
              <span>Time needed</span>
            </div>
            <div className="font-bold text-kallu-900">{duration(site.visitMin || 60, lang)}</div>
          </div>
          
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-kallu-500 text-[13px] mb-0.5">
              <Route className="w-4 h-4" />
              <span>Walking</span>
            </div>
            <div className="font-bold text-kallu-900 capitalize">{site.walking}</div>
          </div>
          
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-kallu-500 text-[13px] mb-0.5">
              <Ticket className="w-4 h-4" />
              <span>Entry</span>
            </div>
            <div className="font-bold text-kallu-900">
              {site.fee ? inr(site.fee.indianINR) : t('site.free' as any)}
            </div>
            {site.fee && !site.fee.verified && (
              <div className="text-[11px] text-arishina-700">{t('site.confirmLocally' as any)}</div>
            )}
          </div>
          
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-kallu-500 text-[13px] mb-0.5">
              <MapPin className="w-4 h-4" />
              <span>Hours</span>
            </div>
            <div className={`font-bold ${closedToday ? 'text-kempu-700 line-through' : 'text-kallu-900'}`}>
              {site.hours ? `${site.hours.open}-${site.hours.close}` : '24 hrs'}
            </div>
            {site.hours && !site.hours.verified && (
              <div className="text-[11px] text-arishina-700">{t('site.confirmLocally' as any)}</div>
            )}
            {closedToday && <div className="text-[11px] text-kempu-700 font-bold">Closed today</div>}
          </div>
        </div>
        
        {isBorder && (
          <div className="mt-4 pt-3 border-t border-maralu-100 text-sm text-kallu-500 italic">
            {t('site.border' as any, { district: site.district || 'neighbouring' })}
          </div>
        )}
      </div>
      
      <div className="px-4 mt-4 flex flex-col gap-3">
        <button onClick={handleListen} className="flex items-center justify-center gap-2 w-full min-h-12 bg-kempu-700 text-hatti-50 rounded-xl font-bold text-lg active:scale-[0.98] transition-transform touch-manipulation">
          {playing ? <Square className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
          {playing ? 'Stop' : 'Listen'}
        </button>
        {audioError && (
          <div className="text-center text-sm text-arishina-800 bg-arishina-100 p-2 rounded-lg">
            {t('ask.noVoice' as any, { lang: LANGS.find(l => l.id === lang)?.label || lang })}
          </div>
        )}
        
        <button onClick={() => navigate(`/ask?site=${site.id}`)} className="flex items-center justify-center gap-2 w-full min-h-12 bg-white text-kallu-900 border-2 border-kempu-700 rounded-xl font-bold active:scale-[0.98] transition-transform touch-manipulation">
          <MessageCircle className="w-5 h-5 text-kempu-700" />
          Ask about this place
        </button>
        
        <button className="flex items-center justify-center gap-2 w-full min-h-12 bg-transparent text-kallu-600 font-semibold opacity-50 pointer-events-none">
          <Plus className="w-5 h-5" />
          Add to journey
        </button>
      </div>

      <section className="mt-8 px-4">
        <h2 className="display text-2xl text-kallu-900 mb-1">{t('site.bestTime' as any)}</h2>
        <CrowdCurve site={site} now={now} data={data} overrides={overrides} reports={reports} />
        <div className="mt-4 flex items-center justify-between">
          <CrowdBadge crowd={crowd} compact />
        </div>
        <p className="text-[13px] text-kallu-500 mt-2">{t('crowd.note' as any)}</p>
      </section>

      <section className="mt-8 mx-4 p-5 bg-white rounded-2xl border border-maralu-200">
        {!reported ? (
          <>
            <h3 className="font-bold text-kallu-900 mb-3">{t('crowd.report' as any)}</h3>
            <div className="flex flex-wrap gap-2">
              <Chip onClick={() => handleReport('quiet')}>Quiet</Chip>
              <Chip onClick={() => handleReport('normal')}>Normal</Chip>
              <Chip onClick={() => handleReport('busy')}>Busy</Chip>
              <Chip onClick={() => handleReport('packed')}>Packed</Chip>
            </div>
          </>
        ) : (
          <div className="font-bold text-hasiru-700 flex items-center gap-2">
            {t('crowd.thanks' as any)}
          </div>
        )}
      </section>

      {storyText && (
        <section className="mt-8 px-4">
          <h2 className="display text-2xl text-kallu-900 mb-3">{t('site.story' as any)}</h2>
          <div className="kasuti-rule mb-4"></div>
          <div className="text-[16px] text-kallu-800 leading-relaxed max-w-prose whitespace-pre-wrap" lang={lang}>
            {storyText}
          </div>
        </section>
      )}

      {siteFacts.length > 0 && (
        <section className="mt-8 px-4">
          <h2 className="display text-2xl text-kallu-900 mb-3">{t('site.facts' as any)}</h2>
          <div className="kasuti-rule mb-4"></div>
          <div className="flex flex-col gap-3">
            {siteFacts.map((fact: any) => (
              <div key={fact.id} className="bg-white p-4 rounded-2xl border border-maralu-200 shadow-sm text-left">
                <p className="text-[15px] text-kallu-800 leading-snug mb-3" lang={lang}>{p(fact.text)}</p>
                <div className="flex flex-wrap gap-2 items-center">
                  {fact.sources && fact.sources.length > 0 && <SourceChip sourceIds={fact.sources} />}
                  {fact.tags?.includes('tradition') && <Pill tone="gold">Local tradition</Pill>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {nearbySites.length > 0 && (
        <section className="mt-8 px-4">
          <h2 className="display text-2xl text-kallu-900 mb-3">{t('site.nearby' as any)}</h2>
          <div className="flex flex-col gap-3">
            {nearbySites.map(({ site: s }) => {
              const c = estimateCrowd(s, now, data.crowd as any, overrides, reports)
              return (
                <div key={s.id} onClick={() => navigate(`/site/${s.id}`)} role="button" className="flex gap-3 p-3 bg-white rounded-2xl border border-maralu-200 active:scale-[0.98] transition-transform touch-manipulation">
                  <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-hatti-100">
                    <SiteImage site={s} showCredit={false} />
                  </div>
                  <div className="flex-1 flex flex-col justify-center min-w-0">
                    <h3 className="font-bold text-kallu-900 leading-tight mb-1 truncate" lang={lang}>{p(s.name)}</h3>
                    <CrowdBadge crowd={c} compact />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {nearbyBiz.length > 0 && (
        <section className="mt-8 px-4">
          <h2 className="display text-2xl text-kallu-900 mb-3">{t('site.local' as any)}</h2>
          <div className="flex flex-col gap-3">
            {nearbyBiz.map(({ biz }) => (
              <BusinessCard key={biz.id} biz={biz} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
