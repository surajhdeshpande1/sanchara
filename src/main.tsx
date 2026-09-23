import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/app.css'
import { KitPage } from './features/kit/KitPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <KitPage />
  </StrictMode>,
)
