import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import App from './App';
import { I18nProvider } from './i18n';
import { AuthProvider } from './lib/auth';
import { ProfileProvider } from './lib/profile';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <AuthProvider>
        <ProfileProvider>
          <Suspense fallback={null}>
            <App />
          </Suspense>
        </ProfileProvider>
      </AuthProvider>
    </I18nProvider>
  </StrictMode>,
);
