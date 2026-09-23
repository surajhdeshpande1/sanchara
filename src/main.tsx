import React from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './styles/app.css'

registerSW({ immediate: true })

const App = () => {
  return (
    <div className="min-h-dvh bg-hatti-100 flex flex-col">
      <div className="ilkal-band w-full" />
      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <p className="kicker text-kempu-700 mb-2 text-center">BAGALKOT DISTRICT</p>
        <h1 className="display display-caps text-6xl text-kempu-700 text-center mb-6">SANCHARA.AI</h1>
        <p className="text-lg text-kallu-700 max-w-xs text-center mb-8">
          See the heritage. Hear the story. Discover the people.
        </p>
        <div className="kasuti-rule w-32" />
      </main>
      <footer className="py-6 text-center">
        <p className="text-kallu-500 text-sm">
          scaffold ready · {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </footer>
    </div>
  )
}

const root = document.getElementById('root')
if (root) {
  createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}
