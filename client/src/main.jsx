import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const Root = import.meta.env.DEV && window.location.pathname === '/preview/feed'
  ? (await import('./preview/FeedPreview.jsx')).default
  : App;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
