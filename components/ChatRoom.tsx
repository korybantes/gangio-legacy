import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { motion, AnimatePresence } from 'framer-motion';
import { UserAvatar } from './UserAvatar';
import { 
  fetchMessages, 
  subscribeToMessages, 
  sendMessage, 
  updateMessage, 
  deleteMessage, 
  updateReaction, 
  setTypingStatus, 
  subscribeToTypingIndicators,
  requestNotificationPermission
} from '@/lib/firebase';
import { Timestamp } from 'firebase/firestore';

interface Message {
  id: string;
  content: string;
  authorId: string;
  channelId: string;
  serverId: string;
  createdAt: any;
  updatedAt: any;
  author: {
    id: string;
    name: string;
    discriminator: string;
    avatarUrl?: string;
  };
  isEdited?: boolean;
  isPinned?: boolean;
  reactions?: {
    emoji: string;
    userIds: string[];
  }[];
  replyToId?: string;
  replyTo?: Message;
  mentions?: string[];
  attachments?: {
    id: string;
    type: string;
    url: string;
    previewUrl?: string;
    width?: number;
    height?: number;
    title?: string;
  }[];
}

interface TypingUser {
  userId: string;
  name: string;
  avatarUrl?: string;
  discriminator: string;
}

interface ChatRoomProps {
  channelId: string;
  serverId: string;
  channelName: string;
  currentUser: any;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({
  channelId,
  serverId,
  channelName,
  currentUser,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [replyToMessageId, setReplyToMessageId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [serverMembers, setServerMembers] = useState<any[]>([]);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const lastVisibleMessageTimestamp = useRef<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // FCM setup temporarily disabled to prevent authentication errors
    console.log('FCM setup skipped to avoid authentication errors');
    
    // Original FCM setup code commented out
    /*
    const setupFCM = async () => {
      try {
        const token = await requestNotificationPermission();
        if (token) {
          console.log('FCM token:', token);
          // TODO: Save this token to the user's profile in the database
          // This would allow sending targeted notifications to this device
        }
      } catch (error) {
        console.error('Error setting up FCM:', error);
      }
    };
    
    setupFCM();
    */
  }, []);
  
  useEffect(() => {
    if (!channelId) return;
    
    const fetchInitialMessages = async () => {
      try {
        setLoading(true);
        const fetchedMessages = await fetchMessages(channelId);
        
        if (fetchedMessages.length > 0) {
          // Cast the messages to the correct type to satisfy TypeScript
          const typedMessages = fetchedMessages as unknown as Message[];
          setMessages(typedMessages);
          setHasMore(fetchedMessages.length >= 25); // If we got 25 messages, there might be more
          
          // Store the timestamp of the oldest message for pagination
          const oldestMessage = fetchedMessages[0];
          if (oldestMessage && oldestMessage.createdAt) {
            lastVisibleMessageTimestamp.current = Timestamp.fromDate(new Date(oldestMessage.createdAt));
          }
        } else {
          setHasMore(false);
        }
      } catch (error) {
        console.error('Error fetching initial messages:', error);
        setError('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialMessages();
  }, [channelId]);

  useEffect(() => {
    if (!channelId) return;

    console.log('Setting up Firestore listener for channel:', channelId);
    
    // Subscribe to real-time updates for messages in this channel
    const unsubscribe = subscribeToMessages(channelId, (newMessages) => {
      // Cast the messages to the correct type
      const typedMessages = newMessages as unknown as Message[];
      setMessages(typedMessages);
    });

    // Cleanup function to unsubscribe when component unmounts or channelId changes
    return () => {
      unsubscribe();
    };
  }, [channelId]);

  useEffect(() => {
    if (!channelId || !currentUser) return;
    
    // Subscribe to typing indicators for this channel
    const unsubscribe = subscribeToTypingIndicators(channelId, (typingData) => {
      // Filter out the current user from typing indicators
      const otherTypingUsers = typingData
        .filter(user => user.userId !== currentUser.id)
        // Remove duplicate users by userId
        .filter((user, index, self) => 
          index === self.findIndex(u => u.userId === user.userId)
        )
        .map(user => ({
          userId: user.userId,
          name: user.name,
          avatarUrl: user.avatarUrl,
          discriminator: user.discriminator
        }));
      
      setTypingUsers(otherTypingUsers);
    });
    
    return () => {
      unsubscribe();
    };
  }, [channelId, currentUser?.id]); // Removed serverMembers as it's not used in this effect

  useEffect(() => {
    if (!serverId) return;
    
    const fetchServerMembers = async () => {
      try {
        const response = await fetch(`/api/servers/${serverId}/members`);
        if (!response.ok) {
          throw new Error('Failed to fetch server members');
        }
        
        const data = await response.json();
        setServerMembers(data.members || []);
      } catch (err) {
        console.error('Error fetching server members:', err);
      }
    };
    
    fetchServerMembers();
  }, [serverId]);
  
  useEffect(() => {
    if (messagesEndRef.current && !loadingMore) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loadingMore]);
  
  const handleSendMessage = async (content: string, attachments: any[] = [], mentions: string[] = []) => {
    if (!content.trim() && attachments.length === 0 || !channelId || !currentUser) return;
    
      const optimisticId = `temp-${Date.now()}`;
      const optimisticMessage: Message = {
        id: optimisticId,
        content,
        authorId: currentUser.id,
        channelId,
        serverId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: {
          id: currentUser.id,
          name: currentUser.name,
          discriminator: currentUser.discriminator,
          avatarUrl: currentUser.avatarUrl
        },
        replyToId: replyToMessageId || undefined,
        mentions: mentions,
        reactions: [],
        attachments: attachments
      };
      setMessages(prev => [...prev, optimisticMessage]);
      
    if (replyToMessageId) {
        setReplyToMessageId(null);
    }
    
    try {
      setSendingMessage(true);
      
      const messageData = {
        content: content.trim(),
        authorId: currentUser.id,
        channelId,
        serverId,
        author: {
          id: currentUser.id,
          name: currentUser.name,
          discriminator: currentUser.discriminator,
          avatarUrl: currentUser.avatarUrl || null,
          },
        replyToId: replyToMessageId || null,
        attachments,
        mentions,
        createdAt: null,
        updatedAt: null,
        isEdited: false,
        reactions: []
      };

      // Send message to Firestore
      const savedMessage = await sendMessage(messageData);
      console.log('Message saved to Firestore:', savedMessage);
      
      // Update the optimistic message with the real one
      setMessages(prev => prev.map(msg => 
        msg.id === optimisticId ? { ...savedMessage, id: savedMessage.id } as Message : msg
      ));
      
      // Stop typing indicator
      await handleTypingIndicator(false);

    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
      setMessages(prev => prev.filter(msg => msg.id !== optimisticId));
    } finally {
      setSendingMessage(false);
    }
  };
  
  const handleEditMessage = (id: string) => {
    const message = messages.find(msg => msg.id === id);
    if (message) {
      setEditingMessageId(id);
      setEditedContent(message.content);
    }
  };
  
  const handleSaveEdit = async () => {
    if (!editingMessageId || !editedContent.trim() || !currentUser) return;
    
    const originalMessage = messages.find(m => m.id === editingMessageId);
    if (!originalMessage) return;

    const updatedOptimisticMessage = { 
        ...originalMessage, 
        content: editedContent.trim(), 
        isEdited: true, 
        updatedAt: new Date().toISOString() 
    };
        setMessages(prev => prev.map(msg => 
        msg.id === editingMessageId ? updatedOptimisticMessage : msg
        ));
      
      setEditingMessageId(null);
      setEditedContent('');

    try {
      // Update message in Firestore
      await updateMessage(editingMessageId, editedContent.trim());
      console.log('Message updated in Firestore:', editingMessageId);

    } catch (err) {
      console.error('Error updating message:', err);
      setError('Failed to update message');
      setMessages(prev => prev.map(msg => 
          msg.id === editingMessageId ? originalMessage : msg
      ));
    }
  };
  
  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditedContent('');
  };
  
  const handleDeleteMessage = async (id: string) => {
    const messageToDelete = messages.find(msg => msg.id === id);
    if (!messageToDelete || messageToDelete.author.id !== currentUser?.id) return;

    if (!window.confirm('Are you sure you want to delete this message?')) {
      return;
    }
    
    setMessages(prev => prev.filter(msg => msg.id !== id));
    
    try {
      // Delete message from Firestore
      await deleteMessage(id);
      console.log('Message deleted from Firestore:', id);

    } catch (err) {
      console.error('Error deleting message:', err);
      setError('Failed to delete message');
      setMessages(prev => [...prev, messageToDelete].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
    }
  };
  
  const handleReaction = async (messageId: string, emoji: string) => {
    if (!currentUser) return;

        const message = messages.find(msg => msg.id === messageId);
    if (!message) return;

    const userReacted = message.reactions?.some(r => 
          r.emoji === emoji && r.userIds.includes(currentUser.id)
        );
    const type = userReacted ? 'remove' : 'add';

        setMessages(prev => prev.map(msg => {
          if (msg.id === messageId) {
        const updatedMsg = { ...msg };
        let reactions = [...(updatedMsg.reactions || [])];
        const existingReactionIndex = reactions.findIndex(r => r.emoji === emoji);

        if (type === 'add') {
          if (existingReactionIndex > -1) {
            if (!reactions[existingReactionIndex].userIds.includes(currentUser.id)) {
              reactions[existingReactionIndex].userIds.push(currentUser.id);
            }
            } else {
            reactions.push({ emoji: emoji, userIds: [currentUser.id] });
          }
              } else {
          if (existingReactionIndex > -1) {
            reactions[existingReactionIndex].userIds = reactions[existingReactionIndex].userIds.filter(id => id !== currentUser.id);
            if (reactions[existingReactionIndex].userIds.length === 0) {
              reactions.splice(existingReactionIndex, 1);
            }
          }
        }
        updatedMsg.reactions = reactions;
        return updatedMsg;
          }
          return msg;
        }));

    try {
      // Update reaction in Firestore
      await updateReaction(messageId, emoji, currentUser.id, type);
      console.log('Reaction updated in Firestore:', { messageId, emoji, type });

    } catch (err) {
      console.error('Error reacting to message:', err);
      setError('Failed to update reaction');
    }
  };
  
  const handleReplyToMessage = (messageId: string) => {
    setReplyToMessageId(messageId);
  };
  
  const handleCancelReply = () => {
    setReplyToMessageId(null);
  };
  
  const loadMoreMessages = async () => {
    if (!hasMore || loadingMore || !channelId || !lastVisibleMessageTimestamp.current) return;
    
    try {
      setLoadingMore(true);
      console.log('Loading more messages before:', lastVisibleMessageTimestamp.current);
      
      const olderMessages = await fetchMessages(channelId, lastVisibleMessageTimestamp.current);
      
      if (olderMessages.length > 0) {
        // Cast the messages to the correct type
        const typedMessages = olderMessages as unknown as Message[];
        
        // Add older messages to the beginning of the messages array
        setMessages(prevMessages => [...typedMessages, ...prevMessages]);
        
        // Update the timestamp for the next pagination query
        const oldestMessage = olderMessages[0];
        if (oldestMessage && oldestMessage.createdAt) {
          lastVisibleMessageTimestamp.current = Timestamp.fromDate(new Date(oldestMessage.createdAt));
        }
        
        // Check if there might be more messages
        setHasMore(olderMessages.length >= 25);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
      setError('Failed to load more messages');
    } finally {
      setLoadingMore(false);
    }
  };
  
  useEffect(() => {
    const messagesContainer = messagesContainerRef.current;
    
    if (messagesContainer) {
      const handleScroll = () => {
        if (messagesContainer.scrollTop === 0 && hasMore && !loadingMore) {
          loadMoreMessages();
        }
      };
      
      messagesContainer.addEventListener('scroll', handleScroll);
      
      return () => {
        messagesContainer.removeEventListener('scroll', handleScroll);
      };
    }
  }, [hasMore, loadingMore]);
  
  const getMentionedUsers = (message: Message) => {
    if (!message.content.includes('@')) return [];
    
    const mentionedNames = (message.content.match(/@(\w+)/g) || [])
      .map(mention => mention.substring(1));
    
    return serverMembers
      .filter(member => mentionedNames.includes(member.user.name))
      .map(member => member.user);
  };
  
  const getReplyToMessage = (replyId: string) => {
    return messages.find(msg => msg.id === replyId);
  };

  const handleTypingIndicator = useCallback(async (isTyping: boolean) => {
    if (!currentUser || !channelId) return;
    
    try {
      // Update typing status in Firestore
      await setTypingStatus(channelId, currentUser, isTyping);
      console.log(`Typing status updated for ${currentUser.id}: ${isTyping}`);
    } catch (error) {
      console.error('Error updating typing status:', error);
    }
  }, [channelId, currentUser]);
  
  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-gray-700 bg-gray-800 shadow-md">
        <h2 className="text-white font-semibold flex items-center">
          <span className="text-gray-400 mr-2">#</span>
          {channelName}
        </h2>
      </div>
      
      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500/40 m-3 rounded-md text-white">
          {error}
        </div>
      )}
      
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {loadingMore && (
          <div className="flex justify-center p-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
          </div>
        )}
        
        {hasMore && !loadingMore && (
          <button
            onClick={loadMoreMessages}
            className="w-full py-2 text-gray-400 hover:text-white text-sm hover:bg-gray-700/30 rounded-md transition-colors"
          >
            Load more messages
          </button>
        )}
        
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((message) => {
              const mentionedUsers = getMentionedUsers(message);
              const replyToMessage = message.replyToId ? getReplyToMessage(message.replyToId) : null;
              
              // Find the member and their highest role color
              const member = serverMembers.find(m => m.userId === message.author.id);
              let roleColor = null;
              
              if (member && member.roles && member.roles.length > 0) {
                // Sort roles by position (highest first) and take the color of the highest role
                const sortedRoles = [...member.roles].sort((a, b) => b.position - a.position);
                roleColor = sortedRoles[0].color || null;
              }
              
              // Create a new author object with the role color
              const authorWithRole = {
                ...message.author,
                roleColor: roleColor
              };
              
              return (
                <ChatMessage
                  key={message.id}
                  id={message.id}
                  content={message.content}
                  author={authorWithRole}
                  createdAt={message.createdAt}
                  isEdited={message.isEdited}
                  isPinned={message.isPinned}
                  isMine={message.author.id === currentUser?.id}
                  onEdit={handleEditMessage}
                  onDelete={handleDeleteMessage}
                  onReact={handleReaction}
                  onReply={handleReplyToMessage}
                  currentUserId={currentUser?.id}
                  reactions={message.reactions || []}
                  isEditing={editingMessageId === message.id}
                  editedContent={editedContent}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={handleCancelEdit}
                  onEditChange={(content) => setEditedContent(content)}
                  mentions={message.mentions || []}
                  mentionedUsers={mentionedUsers}
                  replyTo={replyToMessage}
                  attachments={message.attachments || []}
                />
              );
            })}
          </>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <AnimatePresence>
        {typingUsers.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="px-4 py-1 text-gray-400 text-sm flex items-center space-x-2"
          >
            <div className="flex -space-x-2">
              {typingUsers.slice(0, 3).map(user => (
                <UserAvatar 
                  key={user.userId}
                  user={{
                    id: user.userId,
                    name: user.name,
                    image: user.avatarUrl,
                    discriminator: user.discriminator
                  }}
                  size="xs"
                  showStatus={false}
                  className="border-2 border-gray-800"
                />
              ))}
            </div>
            <div>
              <span className="font-medium">
                {typingUsers.length === 1 
                  ? typingUsers[0].name 
                  : typingUsers.length === 2
                    ? `${typingUsers[0].name} and ${typingUsers[1].name}`
                    : typingUsers.length === 3
                      ? `${typingUsers[0].name}, ${typingUsers[1].name}, and ${typingUsers[2].name}`
                      : `${typingUsers[0].name}, ${typingUsers[1].name}, and ${typingUsers.length - 2} others`
                }
              </span>
              {' is typing'}
              <span className="animate-pulse">...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <ChatInput
        channelId={channelId}
        serverId={serverId}
        currentUserId={currentUser?.id}
        replyToMessageId={replyToMessageId}
        onCancelReply={handleCancelReply}
        onSend={handleSendMessage}
        isLoading={sendingMessage}
        serverMembers={serverMembers.map(member => ({
          id: member.userId,
          name: member.user.name,
          discriminator: member.user.discriminator,
          avatarUrl: member.user.avatarUrl
        }))}
        onTyping={handleTypingIndicator}
      />
    </div>
  );
}