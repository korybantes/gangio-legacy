'use client';

import React, { Suspense } from 'react';
import { SocketProvider } from '@/context/socket-context';
import Loading from '@/app/loading';

export default function ServerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <SocketProvider>
        <Suspense fallback={<Loading />}>
          {children}
        </Suspense>
      </SocketProvider>
    </div>
  );
} 