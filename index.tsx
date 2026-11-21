import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/instrument-sans';
import '@fontsource-variable/literata/opsz.css';
import './index.css';
import App from './App';
import { ErrorBoundary } from './components/States';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Kök öğe (#root) bulunamadı.');

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
