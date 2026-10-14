import '@fontsource-variable/inter/wght.css';
import './styles/index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app/App.tsx';
import { AppErrorBoundary } from './components/feedback/AppErrorBoundary.tsx';

const container = document.getElementById('root');
if (!container) throw new Error('Elemento #root não encontrado em index.html.');

createRoot(container).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
);
