import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { AppLayout } from './components/layouts/AppLayout.js';
import './index.css';

// Dev-only: lets us grab UI elements as source context for coding agents.
if (import.meta.env.DEV) {
  void import('react-grab');
}

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root container #root not found');
}

createRoot(container).render(
  <StrictMode>
    <AppLayout />
  </StrictMode>,
);
