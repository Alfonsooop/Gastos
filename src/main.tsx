import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { GroupsProvider } from './state/GroupsContext';
import './state/installPrompt';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GroupsProvider>
      <App />
    </GroupsProvider>
  </StrictMode>,
);
