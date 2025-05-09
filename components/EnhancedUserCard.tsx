import React, { useState, useEffect, useRef } from 'react';
import { User, UserStatus, Badge, Server } from '@/types/models';
import { motion, AnimatePresence } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import { createPortal } from 'react-dom';

interface EnhancedUserCardProps {
  userId: string;
  onClose: () => void;
}

// SVG Badge Icons
const BadgeIcons = {
  founder: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4">
      <path d="M12 1L15.5 8.5L23 9.5L17.5 15L19 23L12 19L5 23L6.5 15L1 9.5L8.5 8.5L12 1Z" fill="#FFD700" stroke="#FFC700" strokeWidth="1.5"/>
    </svg>
  ),
  supporter: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4">
      <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.27 2 8.5C2 5.41 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.08C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.41 22 8.5C22 12.27 18.6 15.36 13.45 20.03L12 21.35Z" fill="#FF6B6B" stroke="#FF4757" strokeWidth="1.5"/>
    </svg>
  ),
  developer: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4">
      <path d="M8 3L4 7L8 11" stroke="#5EEAD4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 3L20 7L16 11" stroke="#5EEAD4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 21L12 11" stroke="#5EEAD4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13 15L9 15" stroke="#5EEAD4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  premium: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4">
      <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z" fill="#A78BFA" stroke="#8B5CF6" strokeWidth="1.5"/>
    </svg>
  ),
  pro: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4">
      <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z" fill="#F472B6" stroke="#EC4899" strokeWidth="1.5"/>
      <circle cx="12" cy="12" r="3" fill="#F472B6" stroke="#EC4899"/>
    </svg>
  ),
  gvng: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4">
      <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z" fill="#A78BFA" stroke="#8B5CF6" strokeWidth="1.5"/>
    </svg>
  ),
  translator: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4">
      <path d="M12.87 15.07L10.33 12.56L10.36 12.53C12.1 10.59 13.34 8.36 14.07 6H17V4H10V2H8V4H1V6H12.17C11.5 7.92 10.44 9.75 9 11.35C8.07 10.32 7.3 9.19 6.69 8H4.69C5.42 9.63 6.42 11.17 7.67 12.56L2.58 17.58L4 19L9 14L12.11 17.11L12.87 15.07ZM18.5 10H16.5L12 22H14L15.12 19H19.87L21 22H23L18.5 10ZM15.88 17L17.5 12.67L19.12 17H15.88Z" fill="#4CAF50"/>
    </svg>
  )
};

export const EnhancedUserCard: React.FC<EnhancedUserCardProps> = ({ userId, onClose }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [mutualServers, setMutualServers] = useState<Server[]>([]);
  const [mutualFriends, setMutualFriends] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'profile' | 'mutual_friends' | 'mutual_servers'>('profile');
  const [friendStatus, setFriendStatus] = useState<'none' | 'friends' | 'pending_outgoing' | 'pending_incoming'>('none');
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    setMounted(true);
    
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Get current user from localStorage
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
          setCurrentUser(JSON.parse(storedUser));
        }
        
        // Fetch user profile
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch user');
        }
        
        const userData = await response.json();
        
        // Add temporary badges for demo if none exist
        if (!userData.badges || userData.badges.length === 0) {
          userData.badges = [
            { id: '1', name: 'Founder', icon: 'founder', description: 'Founded the service' },
            { id: '2', name: 'Supporter', icon: 'supporter', description: 'Supports the platform' }
          ];
        }
        
        setUser(userData);
        
        // Determine friend status
        if (userData.friendIds?.includes(currentUser?.id)) {
          setFriendStatus('friends');
        } else if (userData.outgoingFriendRequests?.includes(currentUser?.id)) {
          setFriendStatus('pending_incoming');
        } else if (userData.incomingFriendRequests?.includes(currentUser?.id)) {
          setFriendStatus('pending_outgoing');
        }
        
        // Fetch mutual servers
        if (currentUser?.id) {
          const serversResponse = await fetch(`/api/users/${userId}/mutual-servers?currentUserId=${currentUser.id}`);
          if (serversResponse.ok) {
            const serversData = await serversResponse.json();
            setMutualServers(serversData.servers || []);
          }
          
          // Fetch mutual friends
          const friendsResponse = await fetch(`/api/users/${userId}/mutual-friends?currentUserId=${currentUser.id}`);
          if (friendsResponse.ok) {
            const friendsData = await friendsResponse.json();
            setMutualFriends(friendsData.friends || []);
          }
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
    
    // Close modal when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    // Add ESC key support to close the modal
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      setMounted(false);
    };
  }, [userId, currentUser?.id, onClose]);
  
  const handleSendFriendRequest = async () => {
    if (!currentUser || !user) return;
    
    try {
      const response = await fetch('/api/friends/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          senderId: currentUser.id,
          recipientId: user.id,
        }),
      });
      
      if (response.ok) {
        setFriendStatus('pending_outgoing');
      }
    } catch (err) {
      console.error('Error sending friend request:', err);
    }
  };
  
  const handleAcceptFriendRequest = async () => {
    if (!currentUser || !user) return;
    
    try {
      const response = await fetch('/api/friends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.id,
          friendId: user.id,
          action: 'accept'
        }),
      });
      
      if (response.ok) {
        setFriendStatus('friends');
      }
    } catch (err) {
      console.error('Error accepting friend request:', err);
    }
  };
  
  const handleCancelFriendRequest = async () => {
    if (!currentUser || !user) return;
    
    try {
      // Cancel/reject friend request
      const response = await fetch('/api/friends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.id,
          friendId: user.id,
          action: 'reject'
        }),
      });
      
      if (response.ok) {
        setFriendStatus('none');
      }
    } catch (err) {
      console.error('Error canceling friend request:', err);
    }
  };
  
  const handleRemoveFriend = async () => {
    if (!currentUser || !user) return;
    
    try {
      const response = await fetch(`/api/friends?userId=${currentUser.id}&friendId=${user.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setFriendStatus('none');
      }
    } catch (err) {
      console.error('Error removing friend:', err);
    }
  };
  
  const StatusIcon = ({ status }: { status: UserStatus }) => {
    switch (status) {
      case 'online':
        return <div className="w-3 h-3 bg-green-500 rounded-full"></div>;
      case 'idle':
        return <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>;
      case 'dnd':
        return <div className="w-3 h-3 bg-red-500 rounded-full"></div>;
      case 'offline':
        return <div className="w-3 h-3 bg-gray-500 rounded-full"></div>;
      default:
        return null;
    }
  };

  const getBadgeIcon = (iconName: string) => {
    const iconKey = iconName.toLowerCase() as keyof typeof BadgeIcons;
    return BadgeIcons[iconKey] || null;
  };
  
  // Create the modal content
  const ModalContent = () => {
    if (loading) {
      return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000]">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-center">
              <motion.div 
                className="w-10 h-10 border-4 border-gray-600 border-t-emerald-500 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            </div>
          </div>
        </div>
      );
    }
    
    if (error || !user) {
      return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000]">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Error</h2>
            <p className="text-red-400">{error || 'User not found'}</p>
            <button 
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md"
            >
              Close
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000]">
        <motion.div 
          ref={modalRef}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-gray-800 rounded-lg w-full max-w-md overflow-hidden flex flex-col shadow-xl"
        >
          {/* Banner and close button */}
          <div className="relative">
            <div className="h-28 bg-gradient-to-r from-gray-700 to-gray-600 overflow-hidden">
              {user.bannerUrl && (
                <img 
                  src={user.bannerUrl} 
                  alt="Profile banner" 
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <button 
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-gray-900/50 hover:bg-gray-900/80 text-white transition-colors"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            
            {/* User avatar */}
            <div className="absolute bottom-0 transform translate-y-1/2 left-6">
              <div className="w-20 h-20 rounded-full bg-gray-700 border-4 border-gray-800 flex items-center justify-center overflow-hidden group relative">
                {user.avatarUrl ? (
                  <img 
                    src={user.avatarUrl} 
                    alt={user.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-white">
                    {user.name.charAt(0)}
                  </span>
                )}
                
                {/* Tooltip */}
                <div className="absolute opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white p-2 rounded text-xs w-48 text-center">
                  <div className="font-bold">{user.name}#{user.discriminator}</div>
                  <div className="text-gray-300 text-xs mt-1">Click to view full profile</div>
                </div>
              </div>
              <div className="absolute bottom-0 right-0">
                <StatusIcon status={user.status} />
              </div>
            </div>
            
            {/* Badges */}
            {user.badges && user.badges.length > 0 && (
              <div className="absolute bottom-0 transform translate-y-1/2 right-6 flex space-x-1.5">
                {user.badges.map(badge => (
                  <div 
                    key={badge.id} 
                    className="w-8 h-8 rounded-full bg-gray-700/80 backdrop-blur-sm border border-gray-600 flex items-center justify-center group relative transition-all duration-300 hover:scale-110"
                    style={{ 
                      boxShadow: `0 0 0 0 ${badge.color || '#6D6D6D'}`,
                    }}
                    onMouseEnter={(e) => {
                      // Add glow effect on hover
                      const target = e.currentTarget;
                      target.style.boxShadow = `0 0 12px 3px ${badge.color || '#6D6D6D'}`;
                    }}
                    onMouseLeave={(e) => {
                      // Remove glow effect
                      const target = e.currentTarget;
                      target.style.boxShadow = `0 0 0 0 ${badge.color || '#6D6D6D'}`;
                    }}
                  >
                    {getBadgeIcon(badge.icon)}
                    
                    {/* Badge tooltip */}
                    <div className="absolute opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 bottom-full mb-2 z-10 transform -translate-x-1/2 left-1/2">
                      <div className="bg-gray-900 text-white py-2 px-3 rounded text-xs shadow-lg border border-gray-700">
                        <div className="font-bold text-center">{badge.name}</div>
                        {badge.description && (
                          <div className="text-gray-300 text-xs mt-1 text-center max-w-[150px]">{badge.description}</div>
                        )}
                      </div>
                      <div className="w-2 h-2 bg-gray-900 border-r border-b border-gray-700 transform rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* User info */}
          <div className="px-6 pt-14 pb-3">
            <div className="flex items-center">
              <h2 className="text-xl font-bold text-white">{user.name}</h2>
              <span className="ml-1 text-gray-400">#{user.discriminator}</span>
              {user.isNew && (
                <span className="ml-2 text-xs px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30">
                  New
                </span>
              )}
            </div>
            
            {/* Position & Company */}
            {(user.position || user.company) && (
              <div className="mt-1 text-gray-300">
                {user.position && <span>{user.position}</span>}
                {user.position && user.company && <span> @ </span>}
                {user.company && <span className="font-medium">{user.company}</span>}
              </div>
            )}
            
            {/* Pronouns */}
            {user.pronouns && (
              <div className="mt-1 text-gray-400 text-sm">
                {user.pronouns}
              </div>
            )}
            
            {/* Bio */}
            {user.bio && (
              <div className="mt-3 px-3 py-2 bg-gray-700/30 rounded-md text-gray-300 text-sm">
                {user.bio}
              </div>
            )}
          </div>
          
          {/* Tabs navigation */}
          <div className="px-6 pb-2">
            <div className="flex border-b border-gray-700">
              <button
                className={`py-2 px-4 ${activeTab === 'profile' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-gray-400 hover:text-white'}`}
                onClick={() => setActiveTab('profile')}
              >
                Profile
              </button>
              <button
                className={`py-2 px-4 flex items-center ${activeTab === 'mutual_servers' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-gray-400 hover:text-white'}`}
                onClick={() => setActiveTab('mutual_servers')}
              >
                Mutual Servers
                {mutualServers.length > 0 && (
                  <span className="ml-1.5 text-xs bg-gray-700 px-1.5 py-0.5 rounded-full">
                    {mutualServers.length}
                  </span>
                )}
              </button>
              <button
                className={`py-2 px-4 flex items-center ${activeTab === 'mutual_friends' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-gray-400 hover:text-white'}`}
                onClick={() => setActiveTab('mutual_friends')}
              >
                Mutual Friends
                {mutualFriends.length > 0 && (
                  <span className="ml-1.5 text-xs bg-gray-700 px-1.5 py-0.5 rounded-full">
                    {mutualFriends.length}
                  </span>
                )}
              </button>
            </div>
          </div>
          
          {/* Tab content */}
          <div className="px-6 pb-6 flex-1 overflow-y-auto">
            {activeTab === 'profile' && (
              <div>
                {/* Member Since */}
                <div className="mt-2 text-gray-400 text-sm">
                  Member since {user.createdAt && format(new Date(user.createdAt), 'MMMM d, yyyy')}
                </div>
                
                {/* Friend action button */}
                {currentUser && currentUser.id !== user.id && (
                  <div className="mt-4">
                    {friendStatus === 'none' && (
                      <button 
                        onClick={handleSendFriendRequest}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md w-full transition-colors"
                      >
                        Add Friend
                      </button>
                    )}
                    
                    {friendStatus === 'pending_outgoing' && (
                      <button 
                        onClick={handleCancelFriendRequest}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md w-full transition-colors"
                      >
                        Cancel Friend Request
                      </button>
                    )}
                    
                    {friendStatus === 'pending_incoming' && (
                      <div className="flex space-x-2">
                        <button 
                          onClick={handleAcceptFriendRequest}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md flex-1 transition-colors"
                        >
                          Accept
                        </button>
                        <button 
                          onClick={handleCancelFriendRequest}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md flex-1 transition-colors"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                    
                    {friendStatus === 'friends' && (
                      <button 
                        onClick={handleRemoveFriend}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md w-full transition-colors"
                      >
                        Remove Friend
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'mutual_servers' && (
              <div className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-2">
                {mutualServers.length === 0 ? (
                  <div className="text-gray-400 text-center py-4">
                    No mutual servers
                  </div>
                ) : (
                  mutualServers.map(server => (
                    <div key={server.id} className="flex items-center p-2 bg-gray-700/30 rounded-md hover:bg-gray-700/50 transition-colors">
                      <div className="w-8 h-8 rounded-md bg-gray-600 flex items-center justify-center overflow-hidden">
                        {server.iconUrl ? (
                          <img 
                            src={server.iconUrl} 
                            alt={server.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-lg font-medium text-white">
                            {server.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="ml-2">
                        <div className="text-white font-medium">{server.name}</div>
                        <div className="text-gray-400 text-xs">
                          {server.memberCount || 'Unknown'} members
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            
            {activeTab === 'mutual_friends' && (
              <div className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-2">
                {mutualFriends.length === 0 ? (
                  <div className="text-gray-400 text-center py-4">
                    No mutual friends
                  </div>
                ) : (
                  mutualFriends.map(friend => (
                    <div key={friend.id} className="flex items-center p-2 bg-gray-700/30 rounded-md hover:bg-gray-700/50 transition-colors">
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden">
                          {friend.avatarUrl ? (
                            <img 
                              src={friend.avatarUrl} 
                              alt={friend.name} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-medium text-white">
                              {friend.name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-gray-800">
                          <StatusIcon status={friend.status} />
                        </div>
                      </div>
                      <div className="ml-2 flex-1">
                        <div className="flex items-center">
                          <div className="text-white font-medium">{friend.name}</div>
                          <span className="ml-1 text-gray-400 text-xs">#{friend.discriminator}</span>
                        </div>
                        <div className="text-gray-400 text-xs">
                          {friend.status}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          
          {/* Keyboard shortcuts hint */}
          <div className="px-6 py-2 bg-gray-700/30 text-gray-400 text-xs flex justify-end items-center">
            <span>Press <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-300 font-mono">ESC</kbd> to close</span>
          </div>
        </motion.div>
      </div>
    );
  };
  
  // Use createPortal to render the modal at the document body level
  if (!mounted) return null;
  
  return createPortal(
    <AnimatePresence>
      <ModalContent />
    </AnimatePresence>,
    document.body
  );
}; 