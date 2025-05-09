'use client';

import { useEffect } from 'react';
import { registerServiceWorker, checkServiceWorkerRegistration } from '@/lib/registerServiceWorker';

export function ServiceWorkerProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Check if service worker is already registered
    checkServiceWorkerRegistration().then((registration) => {
      if (!registration) {
        // Register service worker if not already registered
        registerServiceWorker();
      }
    });
  }, []);

  return <>{children}</>;
}
