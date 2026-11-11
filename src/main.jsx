import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { DemoStoreProvider } from './store/DemoStore.jsx';
import { ToastProvider } from './components/Toast.jsx';
import './styles/global.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <DemoStoreProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </DemoStoreProvider>
    </BrowserRouter>
  </StrictMode>,
);
