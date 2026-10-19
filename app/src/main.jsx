import './styles/site.css';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

/* theme chosen earlier on this device (otherwise the system setting decides, via CSS) */
try {
  const saved = localStorage.getItem('vivinne-theme');
  if (saved === 'light' || saved === 'dark') document.documentElement.setAttribute('data-theme', saved);
} catch (e) { /* storage blocked */ }

createRoot(document.getElementById('root')).render(<App />);
