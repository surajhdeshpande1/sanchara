import { istParts } from '../engine/time'

export function hhmm(ms: number) {
  const p = istParts(ms)
  return `${p.hour.toString().padStart(2, '0')}:${p.minute.toString().padStart(2, '0')}`
}

export function inr(val: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val)
}

export function duration(min: number, lang: string) {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (lang === 'kn') return h > 0 ? `${h}ಗಂ${m > 0 ? ` ${m}ನಿ` : ''}` : `${m}ನಿ`
  if (lang === 'hi') return h > 0 ? `${h}घं${m > 0 ? ` ${m}मि` : ''}` : `${m}मि`
  return h > 0 ? `${h}h${m > 0 ? ` ${m}min` : ''}` : `${m}min`
}

export function pct(val: number) {
  return `${Math.round(val * 100)}%`
}
