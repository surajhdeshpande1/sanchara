import { useState, useEffect } from 'react'
import { useStore, nowFrom } from '../state/store'
import { estimateCrowd } from '../engine/crowd'
import { useEngineCtx } from './data'
import type { Site } from '../engine/types'

export function useNow() {
  const [now, setNow] = useState(() => nowFrom(useStore.getState()))
  useEffect(() => {
    const fn = () => setNow(nowFrom(useStore.getState()))
    const t = setInterval(fn, 30000)
    return () => clearInterval(t)
  }, [])
  return now
}

export function useCrowdAt(site: Site, at: number) {
  const ctx = useEngineCtx()
  return estimateCrowd(site, at, ctx.crowd as any, ctx.overrides, ctx.reports)
}

export function useKeyboardOpen() {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const handle = () => {
      if (window.visualViewport) {
        setOpen(window.innerHeight - window.visualViewport.height > 140)
      }
    }
    window.visualViewport?.addEventListener('resize', handle)
    return () => window.visualViewport?.removeEventListener('resize', handle)
  }, [])
  return open
}

let promptEvent: any = null
let promptListeners = new Set<() => void>()

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  promptEvent = e
  promptListeners.forEach(fn => fn())
})
window.addEventListener('appinstalled', () => {
  promptEvent = null
  promptListeners.forEach(fn => fn())
})

export function useInstallPrompt() {
  const [canInstall, setCanInstall] = useState(!!promptEvent)
  useEffect(() => {
    const fn = () => setCanInstall(!!promptEvent)
    promptListeners.add(fn)
    return () => { promptListeners.delete(fn) }
  }, [])
  return canInstall ? () => { if (promptEvent) promptEvent.prompt() } : null
}
