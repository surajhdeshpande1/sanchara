import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { registerSW } from 'virtual:pwa-register'
import './styles/app.css'

import { loadDatasets, DataContext } from './lib/data'
import type { Datasets } from './lib/data'
import { router } from './app/router'
import { StitchLoader } from './components/Patterns'

registerSW({ immediate: true })

function Root() {
  const [data, setData] = useState<Datasets | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadDatasets()
      .then(setData)
      .catch(e => setError(e.message))
  }, [])

  if (error) {
    return <div className="p-8 text-kempu-700 text-center font-medium bg-hatti-100 min-h-dvh flex items-center justify-center">Error loading dataset: {error}</div>
  }

  if (!data) {
    return (
      <div className="bg-hatti-100 min-h-dvh flex flex-col items-center justify-center pb-20">
        <div className="w-24 text-kempu-700 flex justify-center"><StitchLoader size={96} /></div>
      </div>
    )
  }

  return (
    <StrictMode>
      <DataContext.Provider value={data}>
        <RouterProvider router={router} />
      </DataContext.Provider>
    </StrictMode>
  )
}

createRoot(document.getElementById('root')!).render(<Root />)
