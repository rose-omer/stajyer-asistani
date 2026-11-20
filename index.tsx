import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/ibm-plex-sans';
import '@fontsource-variable/source-serif-4';
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
