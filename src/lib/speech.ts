import { bcp47 } from './i18n'

export function voiceFor(lang: string): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null
  const voices = window.speechSynthesis.getVoices()
  const bcp = bcp47(lang)
  
  const exact = voices.find(v => v.lang === bcp || v.lang === bcp.replace('-', '_'))
  if (exact) return exact

  const prefix = bcp.split('-')[0]
  const partial = voices.find(v => v.lang.startsWith(prefix))
  return partial || null
}

export function speak(text: string, lang: string, onEnd?: () => void): boolean {
  if (typeof window === 'undefined' || !window.speechSynthesis) return false

  window.speechSynthesis.cancel()

  const voice = voiceFor(lang)
  if (!voice && lang !== 'en') {
    return false
  }

  const ut = new SpeechSynthesisUtterance(text)
  if (voice) {
    ut.voice = voice
    ut.lang = voice.lang
  } else {
    ut.lang = bcp47(lang)
  }
  
  if (lang === 'kn' || lang === 'hi') {
    ut.rate = 0.95
  }

  if (onEnd) {
    ut.onend = onEnd
    ut.onerror = onEnd
  }

  window.speechSynthesis.speak(ut)
  return true
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
}
