import { createBrowserRouter } from 'react-router'
import { Suspense, lazy } from 'react'
import { AppShell } from '../components/AppShell'
import { StitchLoader } from '../components/Patterns'

import { HomePage } from '../features/home/HomePage'
import { PlanPage } from '../features/plan/PlanPage'
import { SitePage } from '../features/site/SitePage'

function page(importFn: () => Promise<any>, name: string) {
  const LazyComp = lazy(() => importFn().then(m => ({ default: m[name] })))
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[50dvh]" aria-busy><div className="w-[84px] text-kempu-700 flex justify-center"><StitchLoader size={84} /></div></div>}>
      <LazyComp />
    </Suspense>
  )
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'plan', element: <PlanPage /> },
      { path: 'site/:id', element: <SitePage /> },
      { path: 'explore', element: page(() => import('../features/about/ExplorePage'), 'ExplorePage') },
      { path: 'journey', element: page(() => import('../features/journey/JourneyPage'), 'JourneyPage') },
      { path: 'scan', element: page(() => import('../features/scan/ScanPage'), 'ScanPage') },
      { path: 'ask', element: page(() => import('../features/ask/AskPage'), 'AskPage') },
      { path: 'impact', element: page(() => import('../features/impact/ImpactPage'), 'ImpactPage') },
      { path: 'district', element: page(() => import('../features/district/DistrictPage'), 'DistrictPage') },
      { path: 'about', element: page(() => import('../features/about/AboutPage'), 'AboutPage') },
      { path: '*', element: <HomePage /> }
    ]
  }
])
