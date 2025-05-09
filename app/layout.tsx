import type { Metadata } from 'next';
import './globals.css';
import '@livekit/components-styles';
import { SocketProvider } from '@/context/socket-context';
import { SessionProvider } from '@/components/providers/session-provider';
import { ServiceWorkerProvider } from '@/components/providers/service-worker-provider';
import { ModalProvider } from '@/providers/ModalProvider';

export const metadata: Metadata = {
  title: 'gvng.io',
  description: 'Connect with friends and communities.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <ServiceWorkerProvider>
            <SocketProvider>
              <ModalProvider />
              {children}
            </SocketProvider>
          </ServiceWorkerProvider>
        </SessionProvider>
      </body>
    </html>
  );
}