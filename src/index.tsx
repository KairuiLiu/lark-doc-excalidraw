import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ExcalidrawDataProvider } from './contexts/ExcalidrawDataContext';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <ExcalidrawDataProvider>
      <App />
    </ExcalidrawDataProvider>
  </React.StrictMode>
);
