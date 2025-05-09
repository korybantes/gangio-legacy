'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

type SocketContextType = {
  socket: Socket | null;
  isConnected: boolean;
  connect: () => void;
};

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  connect: () => {}
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const reconnectAttempts = useRef<number>(0);
  const maxReconnectAttempts = 5;
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const connectionInProgress = useRef<boolean>(false);

  // Function to initialize socket
  const initializeSocket = () => {
    if (typeof window === 'undefined') return null;
    if (connectionInProgress.current) return null;

    try {
      // Try to get current user from localStorage
      const userJson = localStorage.getItem('currentUser');
      if (!userJson) return null;

      let user;
      try {
        user = JSON.parse(userJson);
        if (!user || !user.id) {
          console.error('Invalid user data in localStorage');
          return null;
        }
      } catch (parseError) {
        console.error('Error parsing user data:', parseError);
        return null;
      }

      setUserId(user.id);
      connectionInProgress.current = true;

      // Disconnect existing socket if any
      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      // Clear any pending reconnect timers
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }

      // Create a new socket connection
      const socketUrl = process.env.NEXT_PUBLIC_API_URL || window.location.origin;
      console.log(`Connecting to socket at ${socketUrl} with path /api/socket`);
      
      const socketInstance = io(socketUrl, {
        query: {
          userId: user.id
        },
        path: '/api/socket',
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: 1000,
        timeout: 20000,
        autoConnect: true
      });

      // Set up event listeners
      socketInstance.on('connect', () => {
        console.log('Socket connected!', socketInstance.id);
        setIsConnected(true);
        reconnectAttempts.current = 0;
        connectionInProgress.current = false;
      });

      socketInstance.on('disconnect', (reason) => {
        console.log('Socket disconnected! Reason:', reason);
        setIsConnected(false);
        connectionInProgress.current = false;
        
        // If the server closed the connection, try to reconnect manually
        if (reason === 'io server disconnect' || reason === 'transport close') {
          // Manual reconnection after a delay
          reconnectTimerRef.current = setTimeout(() => {
            if (reconnectAttempts.current < maxReconnectAttempts) {
              console.log(`Attempting to reconnect (${reconnectAttempts.current + 1}/${maxReconnectAttempts})...`);
              reconnectAttempts.current++;
            socketInstance.connect();
            } else {
              console.log('Max reconnection attempts reached. Not trying anymore.');
            }
          }, 3000);
        }
      });

      socketInstance.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
        setIsConnected(false);
        connectionInProgress.current = false;
        
        // Only increment if we're manually handling reconnection
        if (reconnectTimerRef.current) {
        reconnectAttempts.current++;
        }
        
        if (reconnectAttempts.current >= maxReconnectAttempts) {
          console.error('Max reconnection attempts reached. Stopping reconnection attempts.');
          if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
          }
          socketInstance.disconnect();
        }
      });

      socketInstance.on('error', (error) => {
        console.error('Socket error:', error);
        connectionInProgress.current = false;
      });

      socketRef.current = socketInstance;
      setSocket(socketInstance);

      return socketInstance;
    } catch (error) {
      console.error('Error initializing socket:', error);
      connectionInProgress.current = false;
      return null;
    }
  };

  // Initialize socket on component mount
  useEffect(() => {
    const socketInstance = initializeSocket();
    
    // Check for user changes (login/logout) every 5 seconds instead of every second
    const userCheckInterval = setInterval(() => {
      try {
        const userJson = localStorage.getItem('currentUser');
        
        if (!userJson && userId) {
          // User logged out, disconnect socket
          if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
            setSocket(null);
          }
          setUserId(null);
          setIsConnected(false);
        } else if (userJson) {
          try {
            const user = JSON.parse(userJson);
            // If different user or no socket, initialize new connection
            if (user.id !== userId || !socketRef.current) {
              initializeSocket();
            } else if (!isConnected && socketRef.current && !connectionInProgress.current) {
              // Try reconnecting if we have a socket but not connected
              connect();
            }
          } catch (error) {
            console.error('Error checking user:', error);
          }
        }
      } catch (error) {
        console.error('Error in user check interval:', error);
      }
    }, 5000);
    
    // Additional check for network changes
    window.addEventListener('online', () => {
      console.log('Network connection restored. Attempting to reconnect socket...');
      if (userId && !isConnected) {
        connect();
      }
    });
    
    // Cleanup
    return () => {
      clearInterval(userCheckInterval);
      
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      
      if (socketInstance) {
        socketInstance.disconnect();
      }
      
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      
      window.removeEventListener('online', () => {
        if (userId && !isConnected) connect();
      });
    };
  }, [userId, isConnected]); // Depend on both userId and connection state

  const connect = () => {
    if (connectionInProgress.current) return;
    
    if (socketRef.current && !isConnected) {
      reconnectAttempts.current = 0;
      socketRef.current.connect();
    } else if (!socketRef.current) {
      initializeSocket();
    }
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, connect }}>
      {children}
    </SocketContext.Provider>
  );
}; 