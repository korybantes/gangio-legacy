'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import ThreeBackground from '@/components/ui/ThreeBackground';
import { ChatRoom } from '@/components/ChatRoom';

interface DirectMessagePageProps {
  params: {
    userId: string;
  };
}

export default function DirectMessagePage({ params }: DirectMessagePageProps) {
  const { userId } = params;
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [recipient, setRecipient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Check if user is logged in
    const userJson = localStorage.getItem('currentUser');
    if (!userJson) {
      router.push('/login');
      return;
    }
    
    try {
      const user = JSON.parse(userJson);
      setCurrentUser(user);
      
      // Fetch recipient user data
      const fetchRecipient = async () => {
        try {
          const response = await fetch(`/api/users/${userId}`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch user data');
          }
          
          const data = await response.json();
          setRecipient(data);
        } catch (err) {
          console.error('Error fetching recipient:', err);
          setError('Could not load user data');
        } finally {
          setLoading(false);
        }
      };
      
      fetchRecipient();
    } catch (err) {
      console.error('Error parsing user data:', err);
      router.push('/login');
    }
  }, [userId, router]);
  
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-900">
        <motion.div 
          className="h-12 w-12 rounded-full border-t-2 border-b-2 border-blue-500"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }
  
  if (error || !recipient) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Error</h2>
          <p className="text-gray-400 mb-6">{error || 'User not found'}</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }
  
  // Create a virtual channel ID for direct messages
  const dmChannelId = [currentUser.id, recipient.id].sort().join('-');
  
  return (
    <div className="h-screen bg-gray-900 text-white overflow-hidden">
      <ThreeBackground preset="chat" />
      
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="h-16 px-4 bg-gray-800 flex items-center border-b border-gray-700">
          <div className="flex items-center">
            <button 
              onClick={() => router.push('/')}
              className="mr-4 p-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            </button>
            
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center mr-3 text-lg font-semibold">
              {recipient.name.charAt(0).toUpperCase()}
            </div>
            
            <div>
              <h2 className="font-medium">{recipient.name}</h2>
              <p className="text-xs text-gray-400">Direct Message</p>
            </div>
          </div>
        </div>
        
        {/* Chat container */}
        <div className="flex-1">
          <ChatRoom 
            channelId={dmChannelId}
            serverId="direct-messages"
            channelName={`DM with ${recipient.name}`}
            currentUser={currentUser}
          />
        </div>
      </div>
    </div>
  );
} 