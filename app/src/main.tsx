import './styles/site.css';
import { createRoot } from 'react-dom/client';
import App from './App';

/* theme chosen earlier on this device (otherwise the system setting decides, via CSS) */
try {
  const saved = localStorage.getItem('vivinne-theme');
  if (saved === 'light' || saved === 'dark') document.documentElement.setAttribute('data-theme', saved);
} catch { /* storage blocked */ }

const root = document.getElementById('root');
if (!root) throw new Error('#root is missing from index.html');
createRoot(root).render(<App />);
