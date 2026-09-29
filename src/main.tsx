import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { GroupsProvider } from './state/GroupsContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GroupsProvider>
      <App />
    </GroupsProvider>
  </StrictMode>,
);
