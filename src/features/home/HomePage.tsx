import { motion } from 'framer-motion'
import { ArrowRight, Map, Scan, MessageCircle, Download } from 'lucide-react'
import { useNavigate } from 'react-router'
import { useT } from '../../lib/i18n'
import { useInstallPrompt, useNow } from '../../lib/hooks'
import { useStore, DEFAULT_DRAFT } from '../../state/store'
import { useData } from '../../lib/data'
import { estimateCrowd } from '../../engine/crowd'
import { CrowdBadge } from '../../components/CrowdBadge'
import { Chip } from '../../components/ui'
import { hhmm } from '../../lib/format'

export function HomePage() {
  const { t, lang, p } = useT()
  const navigate = useNavigate()
  const promptInstall = useInstallPrompt()
  const setDraft = useStore(s => s.setDraft)
  const plan = useStore(s => s.plan)
  const data = useData()
  const now = useNow()
  const overrides = useStore(s => s.overrides)
  const reports = useStore(s => s.reports)

  const presets = [
    { label: 'home.chip.4h', values: { days: 0.5 } },
    { label: 'home.chip.hidden', values: { interests: ['hidden', 'architecture'], crowdAversion: 0.8 } },
    { label: 'home.chip.crowds', values: { crowdAversion: 1 } },
    { label: 'home.chip.food', values: { interests: ['food', 'architecture'], includeMeal: true, localBoost: 0.9 } },
    { label: 'home.chip.architecture', values: { interests: ['architecture', 'history'] } },
    { label: 'home.chip.handloom', values: { interests: ['handloom', 'architecture'], localBoost: 1 } }
  ]

  const handlePreset = (values: any) => {
    setDraft({ ...DEFAULT_DRAFT, ...values })
    navigate('/plan')
  }

  let upcomingStop = null
  if (plan && plan.days && plan.days.length > 0) {
    const upcoming = plan.days[0].stops.find(s => s.kind === 'site' && s.start > now)
    if (upcoming && upcoming.siteId) {
      upcomingStop = { siteId: upcoming.siteId, start: upcoming.start }
    }
  }

  const nowSites = ['badami-caves', 'pattadakal', 'aihole-durga', 'mahakuta']
    .map(id => data.siteById.get(id))
    .filter(Boolean)

  return (
    <div className="pb-24 overflow-x-hidden">
      <section className="-mx-4 bg-kempu-800 relative overflow-hidden px-4 pt-12 pb-14 text-hatti-50">
        <div className="absolute inset-0 grain opacity-40 mix-blend-overlay"></div>
        <svg className="absolute -top-12 -right-4 w-64 h-64 text-kempu-700 opacity-90" aria-hidden="true" viewBox="0 0 100 100">
          <rect x="50" y="20" width="30" height="80" rx="4" fill="currentColor" />
          <rect x="30" y="40" width="70" height="60" rx="4" fill="currentColor" />
          <rect x="10" y="60" width="110" height="40" rx="4" fill="currentColor" />
          <rect x="70" y="10" width="10" height="90" rx="2" fill="currentColor" />
        </svg>
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }} className="relative z-10" lang={lang}>
          <div className="kicker text-arishina-300 mb-2">{t('home.kicker' as any)}</div>
          <h1 className="display display-caps text-[3.1rem] leading-[0.92] break-words mb-4">
            {t('home.title' as any)}
          </h1>
          <p className="text-lg text-hatti-200 max-w-md font-medium leading-relaxed">
            {t('app.tagline' as any)}
          </p>
        </motion.div>
      </section>

      <section className="-mt-6 relative z-20 flex flex-col gap-3 px-1 mb-8" lang={lang}>
        <ActionCard 
          icon={<Map className="w-6 h-6" />}
          title={t('home.plan' as any)} 
          sub={t('home.plan.sub' as any)}
          bg="bg-kempu-700 text-hatti-50"
          iconBg="bg-white/15 text-white"
          delay={0.1}
          onClick={() => navigate('/plan')}
        />
        <ActionCard 
          icon={<Scan className="w-6 h-6" />}
          title={t('home.scan' as any)} 
          sub={t('home.scan.sub' as any)}
          bg="bg-kallu-900 text-hatti-50"
          iconBg="bg-white/15 text-white"
          delay={0.17}
          onClick={() => navigate('/scan')}
        />
        <ActionCard 
          icon={<MessageCircle className="w-6 h-6" />}
          title={t('home.ask' as any)} 
          sub={t('home.ask.sub' as any)}
          bg="bg-hatti-50 text-kallu-900 border-2 border-kempu-700"
          iconBg="bg-kempu-700/10 text-kempu-700"
          delay={0.24}
          onClick={() => navigate('/ask')}
        />
      </section>

      {promptInstall && (
        <button onClick={promptInstall} className="w-full mb-8 min-h-12 border-2 border-dashed border-kempu-200 rounded-full flex items-center justify-center gap-2 text-kempu-700 font-semibold touch-manipulation active:scale-[0.98] transition-transform">
          <Download className="w-5 h-5" />
          {t('home.install' as any)}
        </button>
      )}

      {upcomingStop && (
        <div className="mb-8 p-5 bg-arishina-100 rounded-2xl border border-arishina-200 active:scale-[0.98] transition-transform touch-manipulation" onClick={() => navigate('/journey')} role="button">
          <div className="kicker text-arishina-800 mb-1">{t('home.resume' as any)}</div>
          <div className="font-semibold text-kallu-900 text-lg flex items-center gap-2">
            {t('home.next' as any, { site: p(data.siteById.get(upcomingStop.siteId)?.name), time: hhmm(upcomingStop.start) })}
            <ArrowRight className="w-5 h-5 ml-auto text-arishina-700" />
          </div>
        </div>
      )}

      <section className="mb-10">
        <h2 className="text-lg font-bold text-kallu-900 mb-4 px-1">{t('home.prompt' as any)}</h2>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide snap-x">
          {presets.map(preset => (
            <Chip key={preset.label} onClick={() => handlePreset(preset.values)} className="whitespace-nowrap snap-start shrink-0">
              {t(preset.label as any)}
            </Chip>
          ))}
        </div>
      </section>

      <section>
        <div className="kicker text-kallu-500 mb-3 px-1">{t('common.estimated' as any)}</div>
        <h2 className="display text-2xl text-kallu-900 mb-4 px-1">Right now in Bagalkot</h2>
        <div className="grid grid-cols-2 gap-3">
          {nowSites.map(s => {
            const crowd = estimateCrowd(s!, now, data.crowd as any, overrides, reports)
            return (
              <div key={s!.id} onClick={() => navigate(`/site/${s!.id}`)} role="button" className="bg-white p-3 rounded-2xl border border-maralu-200 active:scale-95 touch-manipulation transition-transform flex flex-col justify-between aspect-square">
                <h3 className="font-bold text-kallu-900 leading-tight mb-2 line-clamp-2" lang={lang}>{p(s!.name)}</h3>
                <CrowdBadge crowd={crowd} compact />
              </div>
            )
          })}
        </div>
        <p className="text-[13px] text-kallu-500 mt-4 px-1">{t('crowd.note' as any)}</p>
      </section>
    </div>
  )
}

function ActionCard({ icon, title, sub, bg, iconBg, delay, onClick }: any) {
  return (
    <motion.button 
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay, ease: 'easeOut' }}
      onClick={onClick}
      className={`flex items-center gap-4 p-4 rounded-2xl text-left touch-manipulation active:scale-[0.97] transition-transform ${bg}`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0 py-1">
        <h3 className="display display-caps text-xl leading-none mb-1.5 truncate">{title}</h3>
        <p className="text-sm opacity-90 truncate leading-none">{sub}</p>
      </div>
      <ArrowRight className="w-6 h-6 opacity-50 shrink-0" />
    </motion.button>
  )
}
