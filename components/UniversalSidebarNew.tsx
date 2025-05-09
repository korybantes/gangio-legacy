'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import Link from 'next/link';
import { Server } from '@/types/models';
import ServerIcon from './ServerIcon';
import { useSettingsModal } from '@/hooks/useSettingsModal';

// Animation variants for sidebar elements
const sidebarVariants = {
  hidden: { x: -20, opacity: 0 },
  visible: { 
    x: 0, 
    opacity: 1,
    transition: { 
      duration: 0.4, 
      ease: [0.25, 0.1, 0.25, 1],
      staggerChildren: 0.05
    }
  }
};

// SidebarButton component for navigation items
interface SidebarButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  href?: string;
  isActive?: boolean;
  highlight?: boolean;
  pulseEffect?: boolean;
}

const SidebarButton: React.FC<SidebarButtonProps> = ({
  icon,
  label,
  onClick,
  href,
  isActive = false,
  highlight = false,
  pulseEffect = false
}) => {
  const [hovered, setHovered] = useState(false);
  
  const ButtonContent = (
    <motion.div 
      className={`relative w-14 h-14 mx-auto rounded-full flex items-center justify-center cursor-pointer transition-all duration-300
                ${isActive ? 'bg-emerald-500/20' : 'bg-gray-800/40 hover:bg-gray-700/60'}
                ${highlight ? 'border-2 border-emerald-500/40' : ''}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      {/* Pulse effect */}
      {pulseEffect && (
        <motion.div
          className="absolute inset-0 rounded-full bg-emerald-500/20"
          animate={{ scale: [1, 1.2, 1], opacity: [0.7, 0.5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      
      <div className={`text-xl ${isActive || highlight ? 'text-emerald-500' : 'text-gray-300'}`}>
        {icon}
      </div>
      
      {/* Tooltip */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            className="absolute left-[4.5rem] z-50 py-2 px-3 bg-gray-900/80 backdrop-blur-md border border-gray-800/50 rounded-lg shadow-xl whitespace-nowrap"
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -5 }}
            transition={{ duration: 0.15 }}
          >
            <div className="text-white font-medium text-sm">{label}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
  
  if (href) {
    return (
      <Link href={href} className="block py-2">
        {ButtonContent}
      </Link>
    );
  }
  
  return (
    <div className="py-2" onClick={onClick}>
      {ButtonContent}
    </div>
  );
};

// Separator component
const Separator = () => {
  return <div className="w-10 h-0.5 bg-gray-700/50 mx-auto my-2" />;
};

// Main Sidebar component
interface UniversalSidebarNewProps {
  activeServerId?: string;
  onServerClick?: (serverId: string) => void;
  onCreateServer?: () => void;
}

export const UniversalSidebarNew: React.FC<UniversalSidebarNewProps> = ({
  activeServerId,
  onServerClick,
  onCreateServer
}) => {
  const router = useRouter();
  const settingsModal = useSettingsModal();
  const [servers, setServers] = useState<Server[]>([
    // Temporary test data in case API doesn't work
    {
      id: "server1",
      name: "Gaming Hub",
      ownerId: "user1",
      icon: null,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: "server2",
      name: "Study Group",
      ownerId: "user2",
      icon: null,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: "server3",
      name: "Design Team",
      ownerId: "user1",
      icon: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>("user1"); // Default for testing
  const [inDMs, setInDMs] = useState(false);

  // Check if we're in direct messages
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      setInDMs(path.includes('/direct-messages'));
    }
  }, []);

  // Fetch servers
  useEffect(() => {
    const fetchServers = async () => {
      setLoading(true);

      try {
        // Get current user from localStorage
        const userJson = localStorage.getItem('currentUser');
        if (userJson) {
          const user = JSON.parse(userJson);
          if (!user || !user.id) {
            console.error('User data or ID missing from localStorage.');
            setLoading(false);
            return;
          }
          setCurrentUserId(user.id);

          console.log(`[Sidebar] Fetching servers for user ID: ${user.id}`);
          const response = await fetch(`/api/servers?userId=${user.id}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            // Prevent caching
            cache: 'no-store'
          });

          if (!response.ok) {
            let errorDetails = `Status: ${response.status} ${response.statusText}`;
            try {
              const errorData = await response.json();
              errorDetails = errorData.error || errorData.message || errorDetails;
            } catch (parseError) {
              // Ignore if response body is not JSON or empty
            }
            console.error(`[Sidebar] Failed to fetch user servers: ${errorDetails}`);
            setLoading(false);
            return;
          }

          // If response is OK
          const data = await response.json();
          console.log('[Sidebar] Fetched servers for user:', data);

          // Ensure data is an array before setting
          if (Array.isArray(data)) {
            // Process servers to ensure icons are handled correctly
            const processedServers = data.map(server => {
              console.log(`[Sidebar] Processing server ${server.name} (${server.id})`);
              
              // If server has an icon that's not a string, convert it or set to null
              if (server.icon && typeof server.icon !== 'string') {
                console.log(`[Sidebar] Converting non-string icon for server ${server.id}`);
                return {
                  ...server,
                  icon: null // Set to null if not a string
                };
              }
              
              return server;
            });
            
            console.log('[Sidebar] Processed servers:', processedServers);
            setServers(processedServers);
          } else {
            console.warn('[Sidebar] API response was successful but not an array:', data);
            // Set to empty array if response format is unexpected
          }
        } else {
          // Handle case where user is not found in localStorage
          console.warn('[Sidebar] No currentUser found in localStorage.');
        }
      } catch (err) {
        console.error('[Sidebar] Error fetching servers:', err);
      } finally {
        setLoading(false);
      }
    };

    // Fetch immediately on component mount
    fetchServers();
  }, []);

  const handleServerClick = (serverId: string) => {
    if (onServerClick) {
      onServerClick(serverId);
    } else {
      router.push(`/servers/${serverId}`);
    }
  };

  const handleCreateServer = () => {
    if (onCreateServer) {
      onCreateServer();
    } else {
      router.push('/create-server');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    router.push('/');
    window.location.reload();
  };

  return (
    <motion.div 
      className="h-full w-[80px] bg-gray-900/60 backdrop-blur-lg border-r border-gray-800/30 flex flex-col py-4"
      initial="hidden"
      animate="visible"
      variants={sidebarVariants}
      style={{
        boxShadow: '0 0 20px rgba(0, 0, 0, 0.2)',
      }}
    >
      {/* Home button */}
      <SidebarButton 
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
            <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75v4.5a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198c.03-.028.061-.056.091-.086L12 5.43z" />
          </svg>
        }
        label="Home"
        href="/"
        isActive={activeServerId === 'home'}
      />

      {/* Direct Messages button */}
      <SidebarButton
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z" clipRule="evenodd" />
          </svg>
        }
        label="Direct Messages"
        href="/direct-messages"
        isActive={inDMs}
      />

      <Separator />

      {/* Server list */}
      <div className="flex-1 overflow-hidden pr-1 py-1">
        {loading ? (
          // Loading skeletons
          <div className="space-y-4 mt-2">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="w-14 h-14 rounded-full bg-gray-800/60 mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ 
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </div>
        ) : (
          <Reorder.Group 
            axis="y" 
            values={servers} 
            onReorder={setServers}
            className="space-y-0.5"
          >
            {servers.map((server) => (
              <Reorder.Item 
                key={server.id} 
                value={server}
                className="w-full"
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20
                }}
              >
                <ServerIcon
                  server={server}
                  isActive={activeServerId === server.id}
                  onClick={() => handleServerClick(server.id)}
                  currentUserId={currentUserId}
                />
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}
      </div>

      <Separator />

      {/* Bottom icons */}
      <div className="mt-auto space-y-2">
        {/* Discover Servers */}
        <SidebarButton
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z" clipRule="evenodd" />
            </svg>
          }
          label="Discover Servers"
          href="/discover"
          pulseEffect={true}
          highlight={true}
        />

        {/* Create Server */}
        <SidebarButton
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
            </svg>
          }
          label="Create Server"
          onClick={handleCreateServer}
        />

        {/* Settings */}
        <SidebarButton
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 00-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 00-2.282.819l-.922 1.597a1.875 1.875 0 00.432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 000 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 00-.432 2.385l.922 1.597a1.875 1.875 0 002.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 002.28-.819l.923-1.597a1.875 1.875 0 00-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 000-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 00-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 00-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 00-1.85-1.567h-1.843zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" clipRule="evenodd" />
            </svg>
          }
          label="Settings"
          onClick={() => settingsModal.onOpen('appearance')}
        />

        {/* Logout */}
        <SidebarButton
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path fillRule="evenodd" d="M7.5 3.75A1.5 1.5 0 006 5.25v13.5a1.5 1.5 0 001.5 1.5h6a1.5 1.5 0 001.5-1.5V15a.75.75 0 011.5 0v3.75a3 3 0 01-3 3h-6a3 3 0 01-3-3V5.25a3 3 0 013-3h6a3 3 0 013 3V9A.75.75 0 0115 9V5.25a1.5 1.5 0 00-1.5-1.5h-6zm10.72 4.72a.75.75 0 011.06 0l3 3a.75.75 0 010 1.06l-3 3a.75.75 0 11-1.06-1.06l1.72-1.72H9a.75.75 0 010-1.5h10.94l-1.72-1.72a.75.75 0 010-1.06z" clipRule="evenodd" />
            </svg>
          }
          label="Logout"
          onClick={handleLogout}
        />
      </div>
    </motion.div>
  );
};
