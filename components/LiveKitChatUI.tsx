import React, { useState, useEffect, useRef } from 'react';
import { 
  useDataChannel, 
  useMaybeRoomContext,
  LiveKitRoom,
  useRoomContext,
  useParticipants
} from '@livekit/components-react';
import '@livekit/components-styles';
import { LiveMessageList } from './LiveMessageList';
import { ChatInput } from './ChatInput';

// Types from your existing code
interface Message {
  id: string;
  content: string;
  authorId: string;
  channelId: string;
  serverId: string;
  createdAt: string;
  updatedAt: string;
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
  attachments?: any[];
}

interface TypingUser {
  userId: string;
  name: string;
  avatarUrl?: string;
  discriminator: string;
}

interface LiveKitChatUIProps {
  serverUrl: string;
  token: string;
  roomName: string;
  channelId: string;
  serverId: string;
  channelName: string;
  currentUser: any;
  isDirect?: boolean;
  serverMembers?: any[];
}

// Message types for LiveKit data channel
type LiveKitMessageType = 
  | 'CHAT_MESSAGE' 
  | 'TYPING_INDICATOR' 
  | 'MESSAGE_REACTION' 
  | 'MESSAGE_DELETE' 
  | 'MESSAGE_EDIT';

interface LiveKitMessagePayload {
  type: LiveKitMessageType;
  data: any;
}

// The actual room content component
const RoomContent: React.FC<{
  channelId: string;
  serverId: string;
  channelName: string;
  currentUser: any;
  isDirect?: boolean;
  serverMembers?: any[];
}> = ({
  channelId,
  serverId,
  channelName,
  currentUser,
  isDirect = false,
  serverMembers = []
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [replyToMessageId, setReplyToMessageId] = useState<string | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get LiveKit room context and data channel
  const room = useMaybeRoomContext();
  const { send: sendData, message: dataMessage } = useDataChannel();
  const participants = useParticipants();
  
  // Function to encode message to Uint8Array for data channel
  const encodeMessage = (message: any): Uint8Array => {
    const jsonString = JSON.stringify(message);
    const encoder = new TextEncoder();
    return encoder.encode(jsonString);
  };
  
  // Function to handle typing indicator
  const handleTypingIndicator = (isTyping: boolean) => {
    if (!room || !sendData) return;
    
    sendData(encodeMessage({
      type: 'TYPING_INDICATOR',
      data: {
        channelId,
        userId: currentUser.id,
        isTyping
      }
    }), {});
  };
  
  // Effect to handle incoming data channel messages
  useEffect(() => {
    if (!dataMessage) return;
    
    try {
      const parsedMessage = JSON.parse(new TextDecoder().decode(dataMessage.payload)) as LiveKitMessagePayload;
      
      switch (parsedMessage.type) {
        case 'CHAT_MESSAGE':
          handleNewMessage(parsedMessage.data);
          break;
        case 'TYPING_INDICATOR':
          handleTyping(parsedMessage.data);
          break;
        case 'MESSAGE_REACTION':
          handleMessageReaction(parsedMessage.data);
          break;
        case 'MESSAGE_DELETE':
          handleMessageDelete(parsedMessage.data);
          break;
        case 'MESSAGE_EDIT':
          handleMessageUpdate(parsedMessage.data);
          break;
        default:
          console.log('Unknown message type', parsedMessage.type);
      }
    } catch (error) {
      console.error('Error parsing data channel message:', error);
    }
  }, [dataMessage]);
  
  // Fetch initial messages when component mounts
  useEffect(() => {
    fetchMessages();
  }, [channelId, serverId]);
  
  // Fetch messages from server
  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      
      // Determine the API endpoint based on whether this is a DM or channel message
      const endpoint = isDirect 
        ? `/api/direct-messages?${new URLSearchParams({
            senderId: currentUser.id,
            recipientId: channelId.replace(currentUser.id, '').replace('-', '')
          })}`
        : `/api/messages?${new URLSearchParams({
            channelId,
            serverId
          })}`;
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      const data = await response.json();
      setMessages(data);
      setHasMoreMessages(data.length >= 50); // Assuming API returns 50 messages per page
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle receiving a new message
  const handleNewMessage = (message: Message) => {
    // Only add the message if it's for the current channel
    if (message.channelId === channelId) {
      setMessages(prev => {
        // Check if we already have this message (to avoid duplicates)
        if (prev.some(m => m.id === message.id)) {
          return prev;
        }
        return [...prev, message];
      });
      
      // Remove typing indicator for the user who sent the message
      if (message.authorId) {
        setTypingUsers(prev => prev.filter(user => user.userId !== message.authorId));
      }
    }
  };
  
  // Handle message update
  const handleMessageUpdate = (updatedMessage: Message) => {
    if (updatedMessage.channelId === channelId) {
      setMessages(prev => 
        prev.map(msg => msg.id === updatedMessage.id ? updatedMessage : msg)
      );
    }
  };
  
  // Handle message deletion
  const handleMessageDelete = (data: { id: string, channelId: string }) => {
    if (data.channelId === channelId) {
      setMessages(prev => prev.filter(msg => msg.id !== data.id));
    }
  };
  
  // Handle typing indicators
  const handleTyping = (data: { channelId: string; userId: string; isTyping: boolean }) => {
    if (data.channelId === channelId && data.userId !== currentUser.id) {
      if (data.isTyping) {
        // Find user from server members 
        const typingUser = serverMembers.find(member => member.userId === data.userId);
        
        if (typingUser) {
          setTypingUsers(prev => {
            // Don't add duplicate typing indicators
            if (prev.some(user => user.userId === data.userId)) {
              return prev;
            }
            
            return [...prev, {
              userId: data.userId,
              name: typingUser.user.name,
              avatarUrl: typingUser.user.avatarUrl,
              discriminator: typingUser.user.discriminator
            }];
          });
        }
      } else {
        // Remove typing indicator
        setTypingUsers(prev => prev.filter(user => user.userId !== data.userId));
      }
    }
  };
  
  // Handle message reactions
  const handleMessageReaction = (data: { 
    messageId: string, 
    userId: string, 
    emoji: string, 
    channelId: string,
    type: 'add' | 'remove'
  }) => {
    if (data.channelId === channelId) {
      setMessages(prev => prev.map(msg => {
        if (msg.id === data.messageId) {
          // Create a copy of the message
          const updatedMsg = { ...msg };
          
          // Initialize reactions array if it doesn't exist
          if (!updatedMsg.reactions) {
            updatedMsg.reactions = [];
          }
          
          if (data.type === 'add') {
            // Check if reaction already exists
            const existingReaction = updatedMsg.reactions.find(r => r.emoji === data.emoji);
            
            if (existingReaction) {
              // Add userId to existing reaction if not already there
              if (!existingReaction.userIds.includes(data.userId)) {
                existingReaction.userIds.push(data.userId);
              }
            } else {
              // Create new reaction
              updatedMsg.reactions.push({
                emoji: data.emoji,
                userIds: [data.userId]
              });
            }
          } else {
            // Remove user from reaction
            updatedMsg.reactions = updatedMsg.reactions.map(reaction => {
              if (reaction.emoji === data.emoji) {
                return {
                  ...reaction,
                  userIds: reaction.userIds.filter(id => id !== data.userId)
                };
              }
              return reaction;
            }).filter(reaction => reaction.userIds.length > 0); // Remove reactions with no users
          }
          
          return updatedMsg;
        }
        return msg;
      }));
    }
  };
  
  // Send a new message
  const handleSendMessage = async (content: string, attachments: any[] = [], mentions: string[] = []) => {
    try {
      // Prepare the message data
      const messageData = isDirect 
        ? {
            content,
            senderId: currentUser.id,
            recipientId: channelId.replace(currentUser.id, '').replace('-', ''),
            attachments,
            mentions,
            replyToId: replyToMessageId
          }
        : {
            content,
            authorId: currentUser.id,
            channelId,
            serverId,
            attachments,
            mentions,
            replyToId: replyToMessageId
          };
      
      // First, send via REST API to persist in database
      const endpoint = isDirect ? '/api/direct-messages' : '/api/messages';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      const newMessage = await response.json();
      
      // Then, broadcast via LiveKit data channel for real-time updates
      if (sendData) {
        sendData(encodeMessage({
          type: 'CHAT_MESSAGE',
          data: newMessage
        }), {});
      }
      
      // Reset reply state
      if (replyToMessageId) {
        setReplyToMessageId(null);
      }
      
      return newMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  };
  
  // Prepare to edit a message
  const handleEditMessage = (id: string) => {
    const message = messages.find(msg => msg.id === id);
    
    if (message && message.authorId === currentUser.id) {
      setEditingMessageId(id);
      setEditContent(message.content);
    }
  };
  
  // Save an edited message
  const handleSaveEdit = async () => {
    if (!editingMessageId || !editContent.trim()) return;
    
    try {
      const endpoint = isDirect ? '/api/direct-messages' : '/api/messages';
      const response = await fetch(`${endpoint}/${editingMessageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: editContent,
          authorId: currentUser.id
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update message');
      }
      
      const updatedMessage = await response.json();
      
      // Update local state
      setMessages(prev => 
        prev.map(msg => msg.id === editingMessageId ? updatedMessage : msg)
      );
      
      // Broadcast via LiveKit data channel
      if (sendData) {
        sendData(encodeMessage({
          type: 'MESSAGE_EDIT',
          data: updatedMessage
        }), {});
      }
    } catch (error) {
      console.error('Error updating message:', error);
    } finally {
      setEditingMessageId(null);
      setEditContent('');
    }
  };
  
  // Cancel editing a message
  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditContent('');
  };
  
  // Delete a message
  const handleDeleteMessage = async (id: string) => {
    const message = messages.find(msg => msg.id === id);
    
    if (!message || message.authorId !== currentUser.id) return;
    
    try {
      const endpoint = isDirect ? '/api/direct-messages' : '/api/messages';
      const response = await fetch(`${endpoint}/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          authorId: currentUser.id
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete message');
      }
      
      // Update local state
      setMessages(prev => prev.filter(msg => msg.id !== id));
      
      // Broadcast via LiveKit data channel
      if (sendData) {
        sendData(encodeMessage({
          type: 'MESSAGE_DELETE',
          data: {
            id,
            channelId,
            serverId
          }
        }), {});
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };
  
  // Handle message reactions
  const handleReaction = async (messageId: string, emoji: string) => {
    const message = messages.find(msg => msg.id === messageId);
    if (!message) return;
    
    // Check if user already reacted with this emoji
    const hasReacted = message.reactions?.some(r => 
      r.emoji === emoji && r.userIds.includes(currentUser.id)
    );
    
    const type = hasReacted ? 'remove' : 'add';
    
    try {
      const endpoint = isDirect ? '/api/direct-messages' : '/api/messages';
      const response = await fetch(`${endpoint}/${messageId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: currentUser.id,
          emoji,
          type
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update reaction');
      }
      
      // Broadcast via LiveKit data channel
      if (sendData) {
        sendData(encodeMessage({
          type: 'MESSAGE_REACTION',
          data: {
            messageId,
            userId: currentUser.id,
            emoji,
            channelId,
            type
          }
        }), {});
      }
    } catch (error) {
      console.error('Error reacting to message:', error);
    }
  };
  
  // Handle replying to a message
  const handleReplyToMessage = (messageId: string) => {
    setReplyToMessageId(messageId);
  };
  
  // Cancel reply
  const handleCancelReply = () => {
    setReplyToMessageId(null);
  };
  
  // Load more messages (for pagination)
  const loadMoreMessages = async () => {
    if (loadingMore || !hasMoreMessages) return;
    
    try {
      setLoadingMore(true);
      
      // Get the oldest message timestamp for pagination
      const oldestMessage = messages[0];
      if (!oldestMessage) return;
      
      const beforeTimestamp = new Date(oldestMessage.createdAt).getTime();
      
      // Determine the API endpoint based on whether this is a DM or channel message
      const endpoint = isDirect 
        ? `/api/direct-messages?${new URLSearchParams({
            senderId: currentUser.id,
            recipientId: channelId.replace(currentUser.id, '').replace('-', ''),
            before: beforeTimestamp.toString(),
            limit: '30'
          })}`
        : `/api/messages?${new URLSearchParams({
            channelId,
            serverId,
            before: beforeTimestamp.toString(),
            limit: '30'
          })}`;
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error('Failed to fetch more messages');
      }
      
      const data = await response.json();
      
      if (data.length > 0) {
        setMessages(prev => [...data, ...prev]);
        setHasMoreMessages(data.length >= 30); // If we got less than requested, we're at the end
      } else {
        setHasMoreMessages(false);
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setLoadingMore(false);
    }
  };
  
  // Get mentions for rendering
  const getMentionedUsers = (message: Message) => {
    if (!message.mentions || message.mentions.length === 0) return [];
    
    return message.mentions
      .map(userId => serverMembers.find(member => member.userId === userId)?.user)
      .filter(Boolean);
  };
  
  // Get the reply-to message
  const getReplyToMessage = (replyId: string) => {
    return messages.find(msg => msg.id === replyId);
  };
  
  // Extract the message that's being replied to 
  const replyToMessage = replyToMessageId ? messages.find(msg => msg.id === replyToMessageId) : null;
  
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <LiveMessageList
        messages={messages}
        currentUser={currentUser}
        typingUsers={typingUsers}
        isLoading={isLoading}
        hasMoreMessages={hasMoreMessages}
        loadMoreMessages={loadMoreMessages}
        loadingMore={loadingMore}
        onMessageDelete={handleDeleteMessage}
        onMessageEdit={handleEditMessage}
        onMessageReply={handleReplyToMessage}
        onMessageReaction={handleReaction}
        mentionedUsers={serverMembers.map(member => member.user)}
      />
      
      {/* Edit message form */}
      {editingMessageId && (
        <div className="p-4 bg-gray-800/90 border-t border-gray-700/50">
          <div className="flex items-center text-sm text-emerald-400 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editing message
          </div>
          <div className="flex">
            <input 
              type="text" 
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="flex-1 bg-gray-700/70 text-white rounded-l-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSaveEdit();
                } else if (e.key === 'Escape') {
                  handleCancelEdit();
                }
              }}
            />
            <button 
              onClick={handleSaveEdit}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 transition-colors"
            >
              Save
            </button>
            <button 
              onClick={handleCancelEdit}
              className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded-r-md transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {/* Reply to indicator */}
      {replyToMessage && (
        <div className="px-4 pt-2 bg-gray-800/90 border-t border-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-blue-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              <span>Replying to {replyToMessage.author.name}</span>
            </div>
            <button 
              onClick={handleCancelReply}
              className="text-gray-400 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <div className="ml-5 text-sm text-gray-400 truncate pb-2">
            {replyToMessage.content}
          </div>
        </div>
      )}
      
      {/* Chat input */}
      <div className="p-4 bg-gray-800/90 border-t border-gray-700/50">
        <ChatInput
          channelId={channelId}
          serverId={serverId}
          currentUserId={currentUser.id}
          replyToMessageId={replyToMessageId}
          onCancelReply={handleCancelReply}
          onSend={handleSendMessage}
          placeholder={`Message #${channelName}`}
          serverMembers={serverMembers.map(member => member.user)}
          socket={{
            emit: () => {}, // Placeholder, we'll use LiveKit data channel instead
            on: () => {} 
          }}
          onTyping={handleTypingIndicator}
        />
      </div>
    </div>
  );
};

// Main component that sets up the LiveKit room
export const LiveKitChatUI: React.FC<LiveKitChatUIProps> = ({
  serverUrl,
  token,
  roomName,
  channelId,
  serverId,
  channelName,
  currentUser,
  isDirect = false,
  serverMembers = []
}) => {
  // No token yet, show loading
  if (!token) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }
  
  return (
    <LiveKitRoom
      serverUrl={serverUrl}
      token={token}
      // Make sure LiveKit audio/video is disabled for chat-only room
      options={{
        adaptiveStream: false,
        dynacast: false,
        publishDefaults: {
          simulcast: false,
          stopMicTrackOnMute: true
        }
      }}
      connectOptions={{
        autoSubscribe: false
      }}
      data-lk-theme="default"
      className="h-full"
    >
      <RoomContent
        channelId={channelId}
        serverId={serverId}
        channelName={channelName}
        currentUser={currentUser}
        isDirect={isDirect}
        serverMembers={serverMembers}
      />
    </LiveKitRoom>
  );
}; 