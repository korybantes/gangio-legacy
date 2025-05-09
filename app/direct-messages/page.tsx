'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FriendsContainer } from '@/components/FriendsContainer';
import { CallModal } from '@/components/CallModal';
import { UniversalSidebar } from '@/components/UniversalSidebar';

export default function DirectMessagePage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [friends, setFriends] = useState<any[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showFriendsContainer, setShowFriendsContainer] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [callType, setCallType] = useState<'audio' | 'video'>('audio');
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem('currentUser');
    if (user) {
      const parsedUser = JSON.parse(user);
      setCurrentUser(parsedUser);
      
      // Fetch friends
      fetchFriends(parsedUser.id);
    } else {
      // Redirect to home if not logged in
      router.push('/');
    }
  }, [router]);

  useEffect(() => {
    // Check for friendId in URL params
    if (friends.length > 0) {
      const searchParams = new URLSearchParams(window.location.search);
      const friendId = searchParams.get('friendId');
      
      if (friendId) {
        const friend = friends.find(f => f.id === friendId);
        if (friend) {
          setSelectedFriend(friend);
          fetchMessages(friendId);
        }
      }
    }
  }, [friends]);

  const fetchFriends = async (userId: string) => {
    try {
      const response = await fetch(`/api/friends?userId=${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch friends');
      }
      
      const data = await response.json();
      setFriends(data.friends || []);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching friends:', error);
      setIsLoading(false);
    }
  };

  const fetchMessages = async (friendId: string) => {
    try {
      // This endpoint would need to be implemented
      const response = await fetch(`/api/direct-messages?userId=${currentUser.id}&friendId=${friendId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageInput.trim() || !selectedFriend) return;
    
    try {
      // This endpoint would need to be implemented
      const response = await fetch('/api/direct-messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: messageInput,
          senderId: currentUser.id,
          recipientId: selectedFriend.id,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      // Clear input and refresh messages
      setMessageInput('');
      fetchMessages(selectedFriend.id);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleSelectFriend = (friend: any) => {
    setSelectedFriend(friend);
    fetchMessages(friend.id);
  };

  const handleStartDirectMessage = (friendId: string) => {
    // Find the friend
    const friend = friends.find(f => f.id === friendId);
    if (friend) {
      setSelectedFriend(friend);
      fetchMessages(friendId);
      setShowFriendsContainer(false);
    }
  };

  const handleStartCall = (type: 'audio' | 'video') => {
    if (!selectedFriend) return;
    
    setCallType(type);
    setCallActive(true);
  };

  const handleEndCall = () => {
    setCallActive(false);
  };

  const handleServerClick = (serverId: string) => {
    router.push(`/servers/${serverId}`);
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <motion.div 
          className="h-16 w-16 rounded-full border-t-4 border-b-4 border-emerald-500"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white overflow-hidden">
      
      {/* Universal Sidebar */}
      <UniversalSidebar onServerClick={handleServerClick} />
      
      {/* Friends sidebar */}
      <motion.div 
        className="w-64 bg-gray-800 flex flex-col overflow-hidden"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold mb-1">Direct Messages</h2>
            <p className="text-xs text-gray-400">
              {friends.length} {friends.length === 1 ? 'friend' : 'friends'}
            </p>
          </div>
          <button
            onClick={() => setShowFriendsContainer(true)}
            className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
            title="Manage Friends"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {friends.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <p>No friends yet</p>
              <p className="text-xs mt-2">Add friends to start chatting</p>
            </div>
          ) : (
            friends.map((friend) => (
              <motion.div
                key={friend.id}
                className={`flex items-center p-2 rounded-md cursor-pointer transition-all duration-200 ${selectedFriend?.id === friend.id ? 'bg-gray-700' : 'hover:bg-gray-700/50'}`}
                onClick={() => handleSelectFriend(friend)}
                whileHover={{ x: 4 }}
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-lg font-semibold">
                    {friend.name.charAt(0).toUpperCase()}
                  </div>
                  <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-800 ${friend.status === 'online' ? 'bg-green-500' : friend.status === 'idle' ? 'bg-yellow-500' : friend.status === 'do_not_disturb' ? 'bg-red-500' : 'bg-gray-500'}`}></div>
                </div>
                <div className="ml-3 overflow-hidden">
                  <p className="font-medium truncate">{friend.name}</p>
                  <p className="text-xs text-gray-400 truncate">{friend.status === 'online' ? 'Online' : friend.status === 'idle' ? 'Idle' : friend.status === 'do_not_disturb' ? 'Do Not Disturb' : 'Offline'}</p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
      
      {/* Chat content area */}
      <motion.div 
        className="flex-1 flex flex-col bg-gray-700"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {selectedFriend ? (
          <>
            {/* Chat header */}
            <div className="p-4 border-b border-gray-600 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-lg font-semibold">
                  {selectedFriend.name.charAt(0).toUpperCase()}
                </div>
                <div className="ml-3">
                  <h3 className="font-semibold">{selectedFriend.name}</h3>
                  <p className="text-xs text-gray-400">{selectedFriend.status === 'online' ? 'Online' : selectedFriend.status === 'idle' ? 'Idle' : selectedFriend.status === 'do_not_disturb' ? 'Do Not Disturb' : 'Offline'}</p>
                </div>
              </div>
              
              {/* Call buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleStartCall('audio')}
                  className="p-2 rounded-full bg-gray-600 hover:bg-green-600 transition-colors"
                  title="Start Voice Call"
                  disabled={selectedFriend.status !== 'online'}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleStartCall('video')}
                  className="p-2 rounded-full bg-gray-600 hover:bg-blue-600 transition-colors"
                  title="Start Video Call"
                  disabled={selectedFriend.status !== 'online'}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p>No messages yet</p>
                  <p className="text-xs mt-2">Send a message to start the conversation</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div 
                    key={message.id} 
                    className={`mb-4 ${message.senderId === currentUser.id ? 'flex justify-end' : 'flex justify-start'}`}
                  >
                    <div 
                      className={`max-w-[70%] rounded-lg p-3 ${message.senderId === currentUser.id ? 'bg-emerald-600' : 'bg-gray-600'}`}
                    >
                      <p>{message.content}</p>
                      <p className="text-xs text-gray-300 mt-1 text-right">
                        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Message input */}
            <div className="p-4 border-t border-gray-600">
              <form onSubmit={handleSendMessage} className="flex">
                <input
                  type="text"
                  placeholder={`Message @${selectedFriend.name}`}
                  className="flex-1 bg-gray-800 border border-gray-600 rounded-l-md px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                />
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 rounded-r-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <motion.div 
              className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center mb-6"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </motion.div>
            <h2 className="text-2xl font-bold mb-2">Your Messages</h2>
            <p className="text-gray-400 mb-6 max-w-md">
              Select a friend from the sidebar to start chatting or continue a conversation.
            </p>
            {friends.length === 0 && (
              <motion.button 
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/')}
              >
                Add Friends
              </motion.button>
            )}
          </div>
        )}
      </motion.div>
      
      {/* Render the FriendsContainer when needed */}
      {showFriendsContainer && (
        <FriendsContainer 
          onClose={() => setShowFriendsContainer(false)}
          onStartChat={handleStartDirectMessage}
        />
      )}

      {/* Render the CallModal when a call is active */}
      {callActive && currentUser && selectedFriend && (
        <CallModal 
          isOpen={callActive}
          onClose={handleEndCall}
          callType={callType}
          friendId={selectedFriend.id}
          friendName={selectedFriend.name}
          currentUser={currentUser}
        />
      )}
    </div>
  );
} 