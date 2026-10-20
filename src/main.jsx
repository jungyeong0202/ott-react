import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { useAuthStore } from './store/useAuth'

const unsubscribeAuth = useAuthStore.getState().initializeAuth();
if (import.meta.hot) import.meta.hot.dispose(unsubscribeAuth);

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <StrictMode>
      <App />
    </StrictMode>
  </BrowserRouter>
)
