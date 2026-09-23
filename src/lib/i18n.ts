import en from '../i18n/en.json'
import kn from '../i18n/kn.json'
import hi from '../i18n/hi.json'
import { useStore } from '../state/store'

export type MsgKey = keyof typeof en

export const LANGS = [
  { id: 'kn', label: 'ಕನ್ನಡ', bcp47: 'kn-IN' },
  { id: 'hi', label: 'हिन्दी', bcp47: 'hi-IN' },
  { id: 'en', label: 'English', bcp47: 'en-IN' }
] as const

export function bcp47(lang: string) {
  return LANGS.find(l => l.id === lang)?.bcp47 || 'en-IN'
}

const DICTS: Record<string, typeof en> = { en, kn: kn as any, hi: hi as any }

export function translate(lang: string, key: MsgKey, vars?: Record<string, string | number>) {
  let str = (DICTS[lang]?.[key] || DICTS.en[key]) as string
  if (!str) return key
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(new RegExp(`{${k}}`, 'g'), String(v))
    }
  }
  return str
}

export function pick(l10n: any, lang: string) {
  if (!l10n) return ''
  return l10n[lang] || l10n.en || ''
}

export function useT() {
  const lang = useStore(s => s.lang)
  return {
    lang,
    t: (key: MsgKey, vars?: Record<string, string | number>) => translate(lang, key, vars),
    p: (l10n: any) => pick(l10n, lang)
  }
}
