import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initHighlighter } from './lib/highlight';
import { App } from './App';
import './styles.css';

// Highlighting is ready before the first paint, so no code block ever flashes.
await initHighlighter();

// StrictMode sits at the root, exactly like a fresh Vite + React app. In the dev
// server that is what makes every mount log setup -> cleanup -> setup (§03).
// The built page (npm run build) has no extra cycle, so the same probes log once.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
