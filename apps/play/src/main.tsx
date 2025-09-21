import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './lib/use-theme';
import { BrowserRouter } from 'react-router';
import { AuthProvider } from './contexts/auth-context';
import { Toaster } from 'sonner';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <App />
          <Toaster />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
