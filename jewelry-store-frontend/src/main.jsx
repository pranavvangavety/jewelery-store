import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {AuthProvider} from "./context/AuthContext.jsx";

window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        window.location.reload()
    }
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
      <AuthProvider>
          <App />
      </AuthProvider>
  </StrictMode>,
)
