'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ThreeBackground from '@/components/ui/ThreeBackground';

// Interface removed as props are not directly passed to Client Components this way
// interface ServerPageProps { ... }

// This component primarily acts as a loading/redirector page.
// It fetches server data to find the first channel and redirects.
export default function ServerPage() {
  const params = useParams(); // Get params using the hook
  const serverId = params?.serverId as string; // Access serverId safely (add type assertion)
  
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchServerAndRedirect() {
      // Validate serverId (basic check)
      if (!serverId || typeof serverId !== 'string') {
        console.error('Invalid serverId param:', serverId);
        setError('Invalid server link.');
        setLoading(false);
        return;
      }

      try {
        // Fetch channels directly, assuming the user has access
        // The Channel component itself will do a more thorough access check
        console.log(`[ServerPage] Fetching channels for server: ${serverId}`);
        const channelsResponse = await fetch(`/api/servers/${serverId}/channels`);
        
        if (!channelsResponse.ok) {
          const errorData = await channelsResponse.json().catch(() => ({})); // Try to parse error
          console.error(`[ServerPage] Failed to fetch channels (${channelsResponse.status}):`, errorData);
          if (channelsResponse.status === 404) {
            setError('Server not found or you don\'t have access.');
          } else if (channelsResponse.status === 403) {
            setError('You do not have permission to access this server.');
          } else {
            setError(errorData.error || 'Failed to load server channels.');
          }
          setLoading(false);
          return;
        }
        
          const channelsData = await channelsResponse.json();
        console.log(`[ServerPage] Received channels data:`, channelsData);
          
        // Find the first available channel (prefer text)
        let targetChannelId = null;
          if (channelsData.channels && channelsData.channels.length > 0) {
           // Prioritize the default channel if available and valid
           const defaultChannel = channelsData.defaultChannel;
           if (defaultChannel && defaultChannel.id) {
              targetChannelId = defaultChannel.id;
              console.log(`[ServerPage] Using default channel: ${targetChannelId}`);
           } else {
             // Find the first text channel if no valid default
             const firstTextChannel = channelsData.channels.find((ch: any) => ch.type === 'text');
             if (firstTextChannel) {
               targetChannelId = firstTextChannel.id;
               console.log(`[ServerPage] Using first text channel: ${targetChannelId}`);
          } else {
               // Fallback to the very first channel if no text channels
               targetChannelId = channelsData.channels[0].id;
               console.log(`[ServerPage] Using first available channel (fallback): ${targetChannelId}`);
             }
           }
        }

        if (targetChannelId) {
          console.log(`[ServerPage] Redirecting to channel: ${targetChannelId}`);
          // Using replace to avoid adding this loading page to history
          router.replace(`/servers/${serverId}/channels/${targetChannelId}`);
        } else {
          console.error('[ServerPage] No channels found for server:', serverId);
          setError('This server doesn\'t have any channels yet or channels could not be loaded.');
          setLoading(false);
        }
      } catch (err) {
        console.error('[ServerPage] Error during fetch/redirect:', err);
        setError('An unexpected error occurred while loading the server.');
        setLoading(false);
      }
    }
    
    fetchServerAndRedirect();
    // Intentionally run only once on mount, router dependency can cause loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverId]); 
  
  if (loading && !error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
        <ThreeBackground preset="chat" />
        <div className="text-center p-4">
          <p>Loading...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
        <ThreeBackground preset="chat" />
        <div className="text-center max-w-md p-4">
          <h1 className="text-2xl font-bold mb-4">No channels found</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <a 
            href="/"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md"
          >
            Back to Home
          </a>
        </div>
      </div>
    );
  }
  
  return null;
} 