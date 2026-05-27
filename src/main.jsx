import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './store.js'
import { ToastProvider } from './components/ui/Toast'
import ScrollToTop from './components/ui/ScrollToTop'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ToastProvider>
          <ScrollToTop />
          <App />
        </ToastProvider>
      </BrowserRouter>
    </Provider>
  </StrictMode>,
)


