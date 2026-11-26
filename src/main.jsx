import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/site.css'

// Not wrapped in StrictMode: the loader and frame-driven effects must mount exactly once.
createRoot(document.getElementById('root')).render(<App />)
