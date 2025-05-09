import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit, getDocs, onSnapshot, serverTimestamp, Timestamp, getDoc, startAfter, connectFirestoreEmulator } from "firebase/firestore";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { getAuth, signInAnonymously, connectAuthEmulator } from "firebase/auth";
import {
  mockFetchMessages,
  mockSubscribeToMessages,
  mockSendMessage,
  mockUpdateMessage,
  mockDeleteMessage,
  mockUpdateReaction,
  mockSetTypingStatus,
  mockSubscribeToTypingIndicators
} from './mockData';

// Flag to use mock data instead of Firebase
const USE_MOCK_DATA = false;

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase (only if not using mock data)
let app: any;
let db: any;
let auth: any;
let currentUser: any = null;

if (!USE_MOCK_DATA) {
  try {
    // Check if Firebase is already initialized to prevent duplicate initialization
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
      console.log('Firebase initialized successfully');
    } else {
      app = getApp();
      console.log('Using existing Firebase app');
    }
    
    db = getFirestore(app);
    auth = getAuth(app);
    
    // Sign in anonymously to allow Firestore access
    if (typeof window !== 'undefined') {
      // Check if we already have a user before signing in again
      const currentAuthUser = auth.currentUser;
      
      if (currentAuthUser) {
        currentUser = currentAuthUser;
        console.log('Already signed in with UID:', currentUser.uid);
      } else {
        console.log('Attempting anonymous sign-in...');
        signInAnonymously(auth).then((userCredential) => {
          currentUser = userCredential.user;
          console.log('Signed in anonymously with UID:', currentUser.uid);
        }).catch((error) => {
          console.error("Error signing in anonymously:", error);
          // Handle specific error codes
          if (error.code === 'auth/network-request-failed') {
            console.warn('Network request failed. Check your internet connection.');
          }
        });
      }
      
      // Listen for auth state changes
      auth.onAuthStateChanged((user: any) => {
        if (user) {
          currentUser = user;
          console.log('User auth state changed, current user:', user.uid);
        } else {
          currentUser = null;
          console.log('User signed out');
        }
      });
    }
    
    // Disable emulators - using production Firebase
    const USE_EMULATORS = false;
    if (USE_EMULATORS && process.env.NODE_ENV === 'development') {
      try {
        connectFirestoreEmulator(db, 'localhost', 8080);
        connectAuthEmulator(auth, 'http://localhost:9099');
        console.log('Connected to Firebase emulators');
      } catch (error) {
        console.warn('Failed to connect to Firebase emulators:', error);
      }
    }
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    console.warn('Falling back to mock data');
  }
} else {
  console.log('Using mock data for chat functionality');
}

// Initialize Firebase Cloud Messaging
let messaging: any = null;

// Only initialize FCM on the client side
if (typeof window !== 'undefined') {
  try {
    if (app) {
      messaging = getMessaging(app);
      console.log('Firebase Cloud Messaging initialized');
      
      // Request permission for notifications (this will prompt the user)
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          console.log('Notification permission granted.');
          
          // Get the FCM token
          getToken(messaging, {
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY // Using environment variable for VAPID key
          }).then((currentToken) => {
            if (currentToken) {
              console.log('FCM token:', currentToken);
              // TODO: Send this token to your server to enable sending messages to this device
            } else {
              console.log('No registration token available. Request permission to generate one.');
            }
          }).catch((err) => {
            console.error('An error occurred while retrieving token:', err);
          });
          
          // Handle incoming messages when the app is in the foreground
          onMessage(messaging, (payload) => {
            console.log('Message received in foreground:', payload);
            // Display a notification
            if (payload.notification) {
              const notificationTitle = payload.notification.title || 'New Message';
              const notificationOptions = {
                body: payload.notification.body,
                icon: '/logo.png'
              };
              
              // Create and show the notification
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.ready.then(registration => {
                  registration.showNotification(notificationTitle, notificationOptions);
                });
              } else {
                new Notification(notificationTitle, notificationOptions);
              }
            }
          });
        } else {
          console.log('Notification permission denied.');
        }
      }).catch((err) => {
        console.error('Error requesting notification permission:', err);
      });
    }
  } catch (error) {
    console.error("Error initializing Firebase messaging:", error);
  }
}

// Firestore collections
let messagesCollection: any;
let typingCollection: any;

if (!USE_MOCK_DATA && db) {
  messagesCollection = collection(db, 'messages');
  typingCollection = collection(db, 'typing');
}

// Message functions
export const sendMessage = async (messageData: any) => {
  if (USE_MOCK_DATA) {
    return mockSendMessage(messageData);
  }
  
  try {
    // Add server timestamp
    const messageWithTimestamp = {
      ...messageData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(messagesCollection, messageWithTimestamp);
    return { id: docRef.id, ...messageWithTimestamp };
  } catch (error) {
    console.error("Error sending message:", error);
    // Fall back to mock data if Firebase fails
    console.warn("Falling back to mock data for sending message");
    return mockSendMessage(messageData);
  }
};

export const updateMessage = async (messageId: string, content: string) => {
  if (USE_MOCK_DATA) {
    return mockUpdateMessage(messageId, content);
  }
  
  try {
    const messageRef = doc(messagesCollection, messageId);
    await updateDoc(messageRef, { 
      content, 
      isEdited: true,
      updatedAt: serverTimestamp() 
    });
    return true;
  } catch (error) {
    console.error("Error updating message:", error);
    // Fall back to mock data if Firebase fails
    console.warn("Falling back to mock data for updating message");
    return mockUpdateMessage(messageId, content);
  }
};

export const deleteMessage = async (messageId: string) => {
  if (USE_MOCK_DATA) {
    return mockDeleteMessage(messageId);
  }
  
  try {
    const messageRef = doc(messagesCollection, messageId);
    await deleteDoc(messageRef);
    return true;
  } catch (error) {
    console.error("Error deleting message:", error);
    // Fall back to mock data if Firebase fails
    console.warn("Falling back to mock data for deleting message");
    return mockDeleteMessage(messageId);
  }
};

export const fetchMessages = async (channelId: string, lastTimestamp?: Timestamp) => {
  if (USE_MOCK_DATA) {
    return mockFetchMessages(channelId);
  }
  
  try {
    let messagesQuery;
    
    if (lastTimestamp) {
      messagesQuery = query(
        messagesCollection,
        where("channelId", "==", channelId),
        orderBy("createdAt", "desc"),
        startAfter(lastTimestamp),
        limit(25)
      );
    } else {
      messagesQuery = query(
        messagesCollection,
        where("channelId", "==", channelId),
        orderBy("createdAt", "desc"),
        limit(25)
      );
    }
    
    const querySnapshot = await getDocs(messagesQuery);
    const messages = querySnapshot.docs.map(doc => {
      const data = doc.data() as Record<string, any>;
      return {
        id: doc.id,
        content: data.content || '',
        authorId: data.authorId || '',
        channelId: data.channelId || '',
        serverId: data.serverId || '',
        author: data.author || { id: '', name: '', discriminator: '' },
        createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
        isEdited: data.isEdited || false,
        isPinned: data.isPinned || false,
        reactions: data.reactions || [],
        replyToId: data.replyToId || undefined,
        mentions: data.mentions || []
      };
    }).reverse();
    
    return messages;
  } catch (error) {
    console.error("Error fetching messages:", error);
    // Fall back to mock data if Firebase fails
    console.warn("Falling back to mock data for fetching messages");
    return mockFetchMessages(channelId);
  }
};

export const subscribeToMessages = (channelId: string, callback: (messages: any[]) => void): (() => void) => {
  if (USE_MOCK_DATA) {
    return mockSubscribeToMessages(channelId, callback);
  }
  
  try {
    const messagesQuery = query(
      messagesCollection,
      where("channelId", "==", channelId),
      orderBy("createdAt", "desc"),
      limit(100)
    );
    
    return onSnapshot(messagesQuery, (snapshot) => {
      const messages = snapshot.docs.map(doc => {
        const data = doc.data() as Record<string, any>;
        return {
          id: doc.id,
          content: data.content || '',
          authorId: data.authorId || '',
          channelId: data.channelId || '',
          serverId: data.serverId || '',
          author: data.author || { id: '', name: '', discriminator: '' },
          createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
          updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
          isEdited: data.isEdited || false,
          isPinned: data.isPinned || false,
          reactions: data.reactions || [],
          replyToId: data.replyToId || undefined,
          mentions: data.mentions || []
        };
      }).reverse();
      
      callback(messages);
    });
  } catch (error) {
    console.error("Error subscribing to messages:", error);
    // Fall back to mock data if Firebase fails
    console.warn("Falling back to mock data for message subscription");
    return mockSubscribeToMessages(channelId, callback);
  }
};

// Reaction functions
export const updateReaction = async (messageId: string, emoji: string, userId: string, type: 'add' | 'remove') => {
  if (USE_MOCK_DATA) {
    return mockUpdateReaction(messageId, emoji, userId, type);
  }
  
  try {
    const messageRef = doc(messagesCollection, messageId);
    const messageDoc = await getDoc(messageRef);
    
    if (!messageDoc.exists()) {
      throw new Error("Message not found");
    }
    
    const messageData = messageDoc.data();
    const reactions = messageData.reactions || [];
    
    let updatedReactions = [...reactions];
    const existingReactionIndex = updatedReactions.findIndex(r => r.emoji === emoji);
    
    if (type === 'add') {
      if (existingReactionIndex > -1) {
        if (!updatedReactions[existingReactionIndex].userIds.includes(userId)) {
          updatedReactions[existingReactionIndex].userIds.push(userId);
        }
      } else {
        updatedReactions.push({ emoji, userIds: [userId] });
      }
    } else {
      if (existingReactionIndex > -1) {
        updatedReactions[existingReactionIndex].userIds = 
          updatedReactions[existingReactionIndex].userIds.filter((id: string) => id !== userId);
        
        if (updatedReactions[existingReactionIndex].userIds.length === 0) {
          updatedReactions.splice(existingReactionIndex, 1);
        }
      }
    }
    
    await updateDoc(messageRef, { reactions: updatedReactions });
    return true;
  } catch (error) {
    console.error("Error updating reaction:", error);
    // Fall back to mock data if Firebase fails
    console.warn("Falling back to mock data for updating reaction");
    return mockUpdateReaction(messageId, emoji, userId, type);
  }
};

// Typing indicator functions
export const setTypingStatus = async (channelId: string, user: any, isTyping: boolean) => {
  if (USE_MOCK_DATA) {
    return mockSetTypingStatus(channelId, user, isTyping);
  }
  
  try {
    const typingId = `${channelId}_${user.id}`;
    const typingRef = doc(typingCollection, typingId);
    
    if (isTyping) {
      await updateDoc(typingRef, {
        userId: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl || null,
        discriminator: user.discriminator || "",
        channelId,
        timestamp: serverTimestamp()
      }).catch(() => {
        // If document doesn't exist, create it
        return addDoc(typingCollection, {
          userId: user.id,
          name: user.name,
          avatarUrl: user.avatarUrl || null,
          discriminator: user.discriminator || "",
          channelId,
          timestamp: serverTimestamp()
        });
      });
    } else {
      await deleteDoc(typingRef).catch(err => {
        console.log("No typing indicator to remove", err);
      });
    }
    
    return true;
  } catch (error) {
    console.error("Error updating typing status:", error);
    // Fall back to mock data if Firebase fails
    console.warn("Falling back to mock data for typing status");
    return mockSetTypingStatus(channelId, user, isTyping);
  }
};

export const subscribeToTypingIndicators = (channelId: string, callback: (typingUsers: any[]) => void): (() => void) => {
  if (USE_MOCK_DATA) {
    return mockSubscribeToTypingIndicators(channelId, callback);
  }
  
  try {
    const now = new Date();
    now.setSeconds(now.getSeconds() - 10); // Only show typing indicators from the last 10 seconds
    
    const typingQuery = query(
      typingCollection,
      where("channelId", "==", channelId),
      where("timestamp", ">=", Timestamp.fromDate(now))
    );
    
    return onSnapshot(typingQuery, (snapshot) => {
      const typingUsers = snapshot.docs.map(doc => {
        const data = doc.data() as Record<string, any>;
        return {
          userId: data.userId || '',
          name: data.name || '',
          avatarUrl: data.avatarUrl || null,
          discriminator: data.discriminator || '',
          channelId: data.channelId || '',
          timestamp: data.timestamp ? data.timestamp.toDate().toISOString() : new Date().toISOString()
        };
      });
      
      callback(typingUsers);
    });
  } catch (error) {
    console.error("Error subscribing to typing indicators:", error);
    // Fall back to mock data if Firebase fails
    console.warn("Falling back to mock data for typing indicators subscription");
    return mockSubscribeToTypingIndicators(channelId, callback);
  }
};

// FCM functions
export const requestNotificationPermission = async () => {
  // Skip FCM for now to avoid authentication errors
  console.log('FCM functionality temporarily disabled to avoid auth errors');
  return null;
  
  // The code below is commented out to prevent FCM errors
  /*
  if (!messaging) return null;
  
  try {
    // Ensure user is authenticated before requesting FCM token
    if (!currentUser) {
      console.log('Waiting for authentication...');
      // Wait for authentication to complete
      await new Promise<void>((resolve) => {
        const checkAuth = () => {
          if (currentUser) {
            resolve();
          } else if (auth) {
            // Try to sign in anonymously if not already signed in
            signInAnonymously(auth)
              .then((userCredential) => {
                currentUser = userCredential.user;
                console.log('Signed in anonymously with UID:', currentUser.uid);
                resolve();
              })
              .catch((error) => {
                console.error('Error signing in anonymously:', error);
                // Still resolve to continue the flow, but token request might fail
                resolve();
              });
          } else {
            // If auth is not available, resolve anyway to continue the flow
            resolve();
          }
        };
        
        checkAuth();
      });
    }
    
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Notification permission granted, requesting token...');
      try {
        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
        });
        console.log('FCM token obtained successfully:', token);
        return token;
      } catch (tokenError) {
        console.error('Error getting FCM token:', tokenError);
        return null;
      }
    }
    return null;
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return null;
  }
  */
};

export const onMessageListener = () => {
  // Skip FCM message listener to avoid authentication errors
  console.log('FCM message listener temporarily disabled to avoid auth errors');
  return () => {};
  
  // The code below is commented out to prevent FCM errors
  /*
  if (!messaging) return () => {};
  
  try {
    return onMessage(messaging, (payload) => {
      console.log('Message received in foreground:', payload);
      return payload;
    });
  } catch (error) {
    console.error("Error setting up message listener:", error);
    return () => {};
  }
  */
};

export { db };
