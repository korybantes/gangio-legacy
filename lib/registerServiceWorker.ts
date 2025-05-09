// Service Worker Registration for Firebase Cloud Messaging

export function registerServiceWorker() {
  if ('serviceWorker' in navigator && typeof window !== 'undefined') {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/'
        });
        
        console.log('Service Worker registered successfully:', registration.scope);
        
        // You can store the registration for later use
        return registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    });
  } else {
    console.warn('Service Workers are not supported in this browser.');
  }
}

// Check if service worker is already registered
export function checkServiceWorkerRegistration() {
  if ('serviceWorker' in navigator) {
    return navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js')
      .then(registration => {
        if (registration) {
          console.log('Service Worker is already registered:', registration.scope);
          return registration;
        } else {
          console.log('Service Worker is not registered yet');
          return null;
        }
      })
      .catch(error => {
        console.error('Error checking Service Worker registration:', error);
        return null;
      });
  }
  return Promise.resolve(null);
}
