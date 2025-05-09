'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase, getCollection } from '@/lib/db';
import { redirect } from 'next/navigation';
import { FriendModal } from '@/components/ui/FriendModal';
import { WikiModal } from '@/components/ui/WikiModal';
import { DonateModal } from '@/components/ui/DonateModal';
import { FriendsContainer } from '@/components/FriendsContainer';
import { JoinServerModal } from '@/components/JoinServerModal';
import { UniversalSidebarNew } from '@/components/UniversalSidebarNew';
import { SteamPlayerSummary, SteamGame, formatPlaytime, getSteamGameImageUrl } from '@/lib/steamApi';

// Icons
import { FiPlus, FiUsers, FiMessageSquare, FiSettings, FiBook, FiStar, FiTrendingUp, FiCpu, FiClock, FiExternalLink } from 'react-icons/fi';
import { BiGame, BiJoystick, BiWorld, BiRocket, BiTrophy } from 'react-icons/bi';
import { IoGameControllerOutline } from 'react-icons/io5';
import { HiOutlineSparkles } from 'react-icons/hi';
import { SiSteam } from 'react-icons/si';

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem('currentUser');
    if (user) {
      setCurrentUser(JSON.parse(user));
    } else {
      // Redirect to landing page if not logged in
      router.push('/');
      return;
    }
    
    // Simulate loading
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 500); // Reduced loading time
    
    return () => clearTimeout(timeout);
  }, [router]);

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

  if (!currentUser) {
    return null; // This shouldn't happen due to the redirect, but just in case
  }

  return <UserHomePage user={currentUser} />;
}

function UserHomePage({ user }: { user: any }) {
  const [servers, setServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJoinServerModal, setShowJoinServerModal] = useState(false);
  const [showFriendsContainer, setShowFriendsContainer] = useState(false);
  const [showWikiModal, setShowWikiModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState('home');
  const [steamData, setSteamData] = useState<SteamPlayerSummary | null>(null);
  const [loadingSteam, setLoadingSteam] = useState(false);
  const router = useRouter();

  // Function to fetch Steam data for the user
  const fetchSteamData = async () => {
    if (!user) return;
    
    try {
      setLoadingSteam(true);
      const response = await fetch('/api/steam/profile');
      
      if (response.ok) {
        const data = await response.json();
        setSteamData(data);
        console.log('Fetched Steam data:', data);
      } else if (response.status !== 404) {
        // 404 means no Steam ID connected, which is fine
        console.error('Error fetching Steam data:', await response.text());
      }
    } catch (error) {
      console.error('Error fetching Steam data:', error);
    } finally {
      setLoadingSteam(false);
    }
  };

  useEffect(() => {
    const fetchServers = async () => {
      try {
        setLoading(true);
        // Make sure we pass the userId as a URL parameter with timestamp for cache busting
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/servers?userId=${user.id}&t=${timestamp}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Server response error: ${response.status}`, errorText);
          throw new Error(`Failed to fetch servers: ${response.status} ${errorText}`);
        }
        
        const data = await response.json();
        // The API returns an array directly
        const serverArray = Array.isArray(data) ? data : [];
        setServers(serverArray);
        console.log('Fetched servers:', serverArray);
      } catch (error) {
        console.error('Error fetching servers:', error);
        setServers([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };
    
    fetchServers();
    fetchSteamData(); // Fetch Steam data when component mounts
  }, [user]);

  const handleCreateServer = () => {
    router.push('/create-server');
  };

  const handleJoinServer = () => {
    setShowJoinServerModal(true);
  };

  const handleServerClick = (serverId: string) => {
    router.push(`/servers/${serverId}`);
  };

  const toggleFriendsContainer = () => {
    setShowFriendsContainer(prev => !prev);
  };

  const toggleWikiModal = () => {
    setShowWikiModal(prev => !prev);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 to-black text-white overflow-hidden">
      {/* Sidebar */}
      <UniversalSidebarNew 
        activeServerId={activeCategory}
        onServerClick={handleServerClick}
        onCreateServer={handleCreateServer}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-gray-900/50 backdrop-blur-sm rounded-tl-xl rounded-bl-xl overflow-hidden">
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-5xl mx-auto">
            {/* Welcome Header */}
            <div className="flex items-center justify-between mb-8 bg-gradient-to-r from-gray-800/70 to-gray-900/70 p-6 rounded-xl border border-gray-700/50 shadow-lg">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  <span className="bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
                    Welcome, {user.name}!
                  </span>
                </h1>
                <p className="text-gray-300">Ready to connect with your gaming community?</p>
              </div>
              <div className="relative w-24 h-24 hidden md:block">
                <Image 
                  src="/assets/welcome.png" 
                  alt="Welcome" 
                  width={96} 
                  height={96} 
                  className="object-contain"
                />
              </div>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-12">
                <motion.div 
                  className="h-12 w-12 rounded-full border-t-3 border-b-3 border-emerald-500"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {servers.length > 0 ? (
                  servers.map(server => (
                    <motion.div 
                      key={server.id}
                      className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-xl p-6 cursor-pointer hover:shadow-lg hover:shadow-emerald-500/10 border border-gray-700/50 transition-all duration-300"
                      onClick={() => handleServerClick(server.id)}
                      whileHover={{ y: -5, scale: 1.02 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex items-center mb-4">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mr-4 overflow-hidden border border-emerald-500/30">
                          {server.icon ? (
                            <img 
                              src={server.icon.startsWith('data:') ? server.icon : `/api/servers/${server.id}/icon`} 
                              alt={server.name} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).parentElement!.innerHTML = server.name.substring(0, 2).toUpperCase();
                              }}
                            />
                          ) : (
                            <span className="text-xl font-bold text-emerald-400">{server.name.substring(0, 2).toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{server.name}</h3>
                          <div className="flex items-center">
                            <span className={`inline-block w-2 h-2 rounded-full mr-2 ${server.ownerId === user.id ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
                            <p className="text-sm text-gray-400">{server.ownerId === user.id ? 'Owner' : 'Member'}</p>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-300 line-clamp-2 mb-3">
                        {server.description || 'No description available.'}
                      </p>
                      <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
                        <span className="flex items-center">
                          <FiUsers className="mr-1" /> {Math.floor(Math.random() * 20) + 2} members
                        </span>
                        <span className="flex items-center">
                          <FiMessageSquare className="mr-1" /> {Math.floor(Math.random() * 10) + 1} channels
                        </span>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-10 text-center border border-gray-700/30 shadow-lg">
                    <div className="flex justify-center mb-6">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                        <IoGameControllerOutline className="w-10 h-10 text-emerald-400" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-4">Start Your Gaming Journey</h3>
                    <p className="text-gray-400 mb-6">You haven't joined any servers yet. Create your own or join an existing one!</p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                      <motion.button 
                        onClick={handleCreateServer}
                        className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg hover:from-emerald-500 hover:to-teal-500 transition-all duration-300 flex items-center justify-center shadow-lg shadow-emerald-600/20"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <FiPlus className="mr-2" />
                        Create a Server
                      </motion.button>
                      <motion.button 
                        onClick={handleJoinServer}
                        className="px-6 py-3 bg-gray-800 border border-emerald-500/30 rounded-lg hover:bg-gray-700 transition-all duration-300 flex items-center justify-center"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <BiGame className="mr-2 text-emerald-400" />
                        Join a Server
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Quick Actions */}
            <div className="mt-12">
              <h2 className="text-xl font-bold mb-6 flex items-center">
                <HiOutlineSparkles className="mr-2 text-emerald-400" />
                <span className="bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">Quick Actions</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.button 
                  onClick={handleCreateServer}
                  className="p-4 bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-xl hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 flex items-center border border-gray-700/50"
                  whileHover={{ y: -5, scale: 1.02 }}
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center mr-3">
                    <FiPlus className="h-5 w-5 text-emerald-400" />
                  </div>
                  <span>Create Server</span>
                </motion.button>
                <motion.button 
                  onClick={handleJoinServer}
                  className="p-4 bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-xl hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 flex items-center border border-gray-700/50"
                  whileHover={{ y: -5, scale: 1.02 }}
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center mr-3">
                    <BiJoystick className="h-5 w-5 text-emerald-400" />
                  </div>
                  <span>Join Server</span>
                </motion.button>
                <motion.button 
                  onClick={toggleFriendsContainer}
                  className="p-4 bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-xl hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 flex items-center border border-gray-700/50"
                  whileHover={{ y: -5, scale: 1.02 }}
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center mr-3">
                    <FiUsers className="h-5 w-5 text-emerald-400" />
                  </div>
                  <span>Friends</span>
                </motion.button>
                <motion.button 
                  onClick={toggleWikiModal}
                  className="p-4 bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-xl hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 flex items-center border border-gray-700/50"
                  whileHover={{ y: -5, scale: 1.02 }}
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center mr-3">
                    <FiBook className="h-5 w-5 text-emerald-400" />
                  </div>
                  <span>Wiki</span>
                </motion.button>
              </div>
            </div>
            
            {/* Gaming Activity Section */}
            <div className="mt-12 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-10 border border-gray-700/30 shadow-lg relative overflow-hidden">
              {/* Coming Soon Overlay */}
              <div className="absolute inset-0 backdrop-blur-[8px] bg-gray-900/70 z-10 flex flex-col items-center justify-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="relative"
                >
                  <Image 
                    src="/assets/gangiobear-gaming.png" 
                    alt="Gangio Bear Gaming" 
                    width={200} 
                    height={200} 
                    className="drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                  />
                  <motion.div 
                    className="absolute -top-2 -right-2 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    Soon
                  </motion.div>
                </motion.div>
                <motion.h2 
                  className="text-2xl md:text-2xl font-bold mt-8 bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  Coming Soon
                </motion.h2>
                <motion.p 
                  className="text-gray-300 mt-3 max-w-md text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  We're working on an awesome gaming activity tracker. Stay tuned for updates!
                </motion.p>
              </div>
              
              {/* Original content (blurred in background) */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                  <FiTrendingUp className="mr-2 text-emerald-400" />
                  <span className="bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent text-xl font-bold">Gaming Activity</span>
                </div>
                {steamData ? (
                  <div className="flex items-center text-sm text-gray-400">
                    <SiSteam className="mr-2 text-blue-500" />
                    <span>Connected to Steam</span>
                  </div>
                ) : (
                  <button 
                    onClick={() => router.push('/settings?tab=connections')}
                    className="flex items-center text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <SiSteam className="mr-2" />
                    Connect Steam Account
                  </button>
                )}
              </div>
              
              {loadingSteam ? (
                <div className="flex justify-center py-8">
                  <motion.div 
                    className="h-8 w-8 rounded-full border-t-2 border-b-2 border-blue-500"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                </div>
              ) : steamData ? (
                <>
                  {/* Steam Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-800/70 p-4 rounded-lg border border-gray-700/50">
                      <div className="flex items-center justify-between">
                        <h3 className="text-gray-400">Total Playtime</h3>
                        <FiClock className="text-emerald-400" />
                      </div>
                      <p className="text-2xl font-bold text-emerald-400 mt-2">
                        {formatPlaytime(steamData.totalPlaytime)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Across {steamData.totalGames} games</p>
                    </div>
                    
                    {steamData.favoriteGame && (
                      <div className="bg-gray-800/70 p-4 rounded-lg border border-gray-700/50">
                        <div className="flex items-center justify-between">
                          <h3 className="text-gray-400">Favorite Game</h3>
                          <BiTrophy className="text-emerald-400" />
                        </div>
                        <p className="text-xl font-bold text-white mt-2">{steamData.favoriteGame.name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatPlaytime(steamData.favoriteGame.playtime_forever)} played
                        </p>
                      </div>
                    )}
                    
                    <div className="bg-gray-800/70 p-4 rounded-lg border border-gray-700/50">
                      <div className="flex items-center justify-between">
                        <h3 className="text-gray-400">Steam Status</h3>
                        <div className={`h-2 w-2 rounded-full ${steamData.profile.personastate > 0 ? 'bg-green-500' : 'bg-gray-500'}`} />
                      </div>
                      <p className="text-xl font-bold text-white mt-2">{steamData.profile.personaname}</p>
                      <a 
                        href={steamData.profile.profileurl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300 mt-1 flex items-center"
                      >
                        View Profile <FiExternalLink className="ml-1" />
                      </a>
                    </div>
                  </div>
                  
                  {/* Recent Games */}
                  {steamData.recentGames.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-gray-200">Recently Played</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {steamData.recentGames.slice(0, 3).map((game) => (
                          <div 
                            key={game.appid}
                            className="bg-gray-800/60 rounded-lg overflow-hidden flex items-center p-3 border border-gray-700/50"
                          >
                            <div className="w-12 h-12 mr-3 flex-shrink-0 bg-gray-900 rounded overflow-hidden">
                              <img 
                                src={getSteamGameImageUrl(game.appid, game.img_logo_url)}
                                alt={game.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/assets/game-placeholder.png';
                                }}
                              />
                            </div>
                            <div className="overflow-hidden">
                              <p className="font-medium text-white truncate">{game.name}</p>
                              <p className="text-xs text-gray-400">
                                {formatPlaytime(game.playtime_2weeks || 0)} last 2 weeks
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-gray-800/60 p-6 rounded-lg text-center border border-gray-700/50">
                  <div className="flex justify-center mb-4">
                    <SiSteam className="text-4xl text-blue-500/70" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-white">Connect Your Steam Account</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Link your Steam account to see your gaming stats and activity here.
                  </p>
                  <button
                    onClick={() => router.push('/settings?tab=connections')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-colors inline-flex items-center"
                  >
                    <SiSteam className="mr-2" />
                    Connect Steam
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Modals */}
      {showJoinServerModal && (
        <JoinServerModal 
          isOpen={showJoinServerModal} 
          onClose={() => setShowJoinServerModal(false)} 
          onSuccess={(serverId) => router.push(`/servers/${serverId}`)}
        />
      )}
      
      {showFriendsContainer && (
        <FriendsContainer 
          onClose={() => setShowFriendsContainer(false)}
          onStartChat={(friendId) => router.push(`/direct-messages?friendId=${friendId}`)}
        />
      )}
      
      {showWikiModal && (
        <WikiModal 
          isOpen={showWikiModal}
          onClose={() => setShowWikiModal(false)}
        />
      )}
    </div>
  );
}
