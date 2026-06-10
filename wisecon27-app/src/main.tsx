import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { AuthProvider } from './auth'
import { watchForAppUpdates } from './swUpdate'
import { initMode, initTextSize } from './mode'
import './index.css'

initMode()
initTextSize()
watchForAppUpdates()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
