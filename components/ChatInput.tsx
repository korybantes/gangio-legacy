import React, { useState, useRef, useEffect, useCallback } from 'react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import debounce from 'lodash/debounce';
import { FaBold, FaItalic, FaHeading, FaCode, FaListUl, FaQuoteLeft, FaLink } from 'react-icons/fa';
import { BiStrikethrough } from 'react-icons/bi';
import { MdFormatClear } from 'react-icons/md';

// For custom emojis
interface CustomEmoji {
  id: string;
  name: string;
  imageUrl: string;
}

// For GIF objects
interface Gif {
  id: string;
  title: string;
  previewUrl: string;
  gifUrl: string;
  width: number;
  height: number;
}

// For user mentions
interface MentionUser {
  id: string;
  name: string;
  discriminator: string;
  avatarUrl?: string;
}

// Define user role and permissions interface
interface UserPermissions {
  isAdmin?: boolean;
  canModerate?: boolean;
  canFormatText?: boolean;
  canKickUsers?: boolean;
  canBanUsers?: boolean;
  canMuteUsers?: boolean;
}

interface ChatInputProps {
  channelId: string;
  serverId: string;
  currentUserId: string;
  replyToMessageId?: string | null;
  onCancelReply?: () => void;
  onSend: (content: string, attachments?: any[], mentions?: string[]) => void;
  placeholder?: string;
  isLoading?: boolean;
  serverMembers?: MentionUser[];
  socket?: any;
  onTyping?: (isTyping: boolean) => void;
  userPermissions?: UserPermissions;
  isMuted?: boolean;
  muteEndTime?: Date | null;
  onModCommand?: (command: string, targetUser: string, duration?: string) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  channelId,
  serverId,
  currentUserId,
  replyToMessageId,
  onCancelReply,
  onSend,
  placeholder = 'Type a message...',
  isLoading = false,
  serverMembers = [],
  socket = null,
  onTyping,
  userPermissions = {},
  isMuted = false,
  muteEndTime = null,
  onModCommand
}) => {
  const [content, setContent] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [searchGif, setSearchGif] = useState('');
  const [gifs, setGifs] = useState<Gif[]>([]);
  const [customEmojis, setCustomEmojis] = useState<CustomEmoji[]>([]);
  const [nextGifPosition, setNextGifPosition] = useState<string>('');
  const [isLoadingGifs, setIsLoadingGifs] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ start: 0, end: 0 });
  const [mentions, setMentions] = useState<string[]>([]);
  const [messageStatus, setMessageStatus] = useState<'sending' | 'sent' | 'error' | null>(null);
  const [showMarkdownButtons, setShowMarkdownButtons] = useState(false);
  const [muteTimeRemaining, setMuteTimeRemaining] = useState<number | null>(null);
  const [showModCommandHelp, setShowModCommandHelp] = useState(false);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const gifButtonRef = useRef<HTMLButtonElement>(null);
  const gifPickerRef = useRef<HTMLDivElement>(null);
  const mentionSuggestionsRef = useRef<HTMLDivElement>(null);
  
  // Fetch custom emojis for this server
  useEffect(() => {
    const fetchCustomEmojis = async () => {
      try {
        const response = await fetch(`/api/servers/${serverId}/emojis`);
        if (response.ok) {
          const data = await response.json();
          setCustomEmojis(data.emojis || []);
        }
      } catch (error) {
        console.error('Failed to fetch custom emojis:', error);
      }
    };
    
    if (serverId) {
      fetchCustomEmojis();
    }
  }, [serverId]);
  
  // Auto-resize textarea as user types
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
    }
  }, [content]);
  
  // Close emoji picker and GIF picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        showEmojiPicker &&
        emojiPickerRef.current &&
        emojiButtonRef.current &&
        !emojiPickerRef.current.contains(e.target as Node) &&
        !emojiButtonRef.current.contains(e.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
      
      if (
        showGifPicker &&
        gifPickerRef.current &&
        gifButtonRef.current &&
        !gifPickerRef.current.contains(e.target as Node) &&
        !gifButtonRef.current.contains(e.target as Node)
      ) {
        setShowGifPicker(false);
      }
      
      if (
        showMentionSuggestions &&
        mentionSuggestionsRef.current &&
        !mentionSuggestionsRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setShowMentionSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker, showGifPicker, showMentionSuggestions]);
  
  // Search for Tenor GIFs
  const searchGifs = useCallback(
    debounce(async (query: string) => {
      if (!query) {
        // If no query, fetch trending
        fetchTrendingGifs();
        return;
      }
      
      try {
        setIsLoadingGifs(true);
        const response = await fetch(`/api/gifs?q=${encodeURIComponent(query)}&limit=20`);
        
        if (response.ok) {
          const data = await response.json();
          setGifs(data.gifs || []);
          setNextGifPosition(data.next || '');
        }
      } catch (error) {
        console.error('Error searching GIFs:', error);
      } finally {
        setIsLoadingGifs(false);
      }
    }, 300),
    []
  );
  
  // Fetch trending GIFs
  const fetchTrendingGifs = async () => {
    try {
      setIsLoadingGifs(true);
      const response = await fetch('/api/gifs/trending?limit=20');
      
      if (response.ok) {
        const data = await response.json();
        setGifs(data.gifs || []);
        setNextGifPosition(data.next || '');
      }
    } catch (error) {
      console.error('Error fetching trending GIFs:', error);
    } finally {
      setIsLoadingGifs(false);
    }
  };
  
  // Load more GIFs
  const loadMoreGifs = async () => {
    if (!nextGifPosition || isLoadingGifs) return;
    
    try {
      setIsLoadingGifs(true);
      const endpoint = searchGif 
        ? `/api/gifs?q=${encodeURIComponent(searchGif)}&position=${nextGifPosition}` 
        : `/api/gifs/trending?position=${nextGifPosition}`;
      
      const response = await fetch(endpoint);
      
      if (response.ok) {
        const data = await response.json();
        setGifs(prev => [...prev, ...(data.gifs || [])]);
        setNextGifPosition(data.next || '');
      }
    } catch (error) {
      console.error('Error loading more GIFs:', error);
    } finally {
      setIsLoadingGifs(false);
    }
  };
  
  // Initial load of trending GIFs when GIF picker opens
  useEffect(() => {
    if (showGifPicker && gifs.length === 0) {
      fetchTrendingGifs();
    }
  }, [showGifPicker]);
  
  // Handle GIF search input change
  const handleGifSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchGif(query);
    searchGifs(query);
  };
  
  // Handle GIF selection
  const handleGifSelect = (gif: Gif) => {
    // Create an attachment from the GIF
    const gifAttachment = {
      id: gif.id,
      type: 'gif',
      url: gif.gifUrl,
      previewUrl: gif.previewUrl,
      width: gif.width,
      height: gif.height,
      title: gif.title
    };
    
    setAttachments(prev => [...prev, gifAttachment]);
    setShowGifPicker(false);
  };
  
  // Debounced typing indicator
  const debouncedStopTyping = useCallback(
    debounce(() => {
      if (socket) {
        socket.emit('typing', { channelId, isTyping: false });
      }
      if (onTyping) {
        onTyping(false);
      }
    }, 2000),
    [channelId, socket, onTyping]
  );
  
  // Update the handleInputChange function to include typing indicators
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setContent(value);
    
    // Send typing indicator
    if (value.length > 0) {
      if (socket) {
        socket.emit('typing', { channelId, isTyping: true });
      }
      if (onTyping) {
        onTyping(true);
      }
      debouncedStopTyping();
    } else {
      // If content is empty, immediately send stop typing
      if (socket) {
        socket.emit('typing', { channelId, isTyping: false });
      }
      if (onTyping) {
        onTyping(false);
      }
      debouncedStopTyping.cancel();
    }
    
    // Check for mention trigger (@)
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      setShowMentionSuggestions(true);
      setMentionSearch(mentionMatch[1] || '');
      setMentionPosition({
        start: cursorPosition - (mentionMatch[1]?.length || 0) - 1,
        end: cursorPosition
      });
    } else {
      setShowMentionSuggestions(false);
    }
  };
  
  // This section was removed to fix duplicate function declaration

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle enter to send message
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
      return;
    }
    
    // Handle navigation of mention suggestions
    if (showMentionSuggestions) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        // Navigation would be implemented here
      } else if (e.key === 'Escape') {
        setShowMentionSuggestions(false);
      }
    }
  };
  
  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setContent((prev) => prev + emojiData.emoji);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  const handleCustomEmojiClick = (emoji: CustomEmoji) => {
    setContent((prev) => `${prev} :${emoji.name}: `);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  // Mute countdown timer
  useEffect(() => {
    if (isMuted && muteEndTime) {
      const updateRemainingTime = () => {
        const now = new Date();
        const endTime = new Date(muteEndTime);
        const remainingMs = endTime.getTime() - now.getTime();
        
        if (remainingMs <= 0) {
          setMuteTimeRemaining(null);
          return;
        }
        
        setMuteTimeRemaining(Math.ceil(remainingMs / 1000));
      };
      
      // Update immediately
      updateRemainingTime();
      
      // Then update every second
      const interval = setInterval(updateRemainingTime, 1000);
      return () => clearInterval(interval);
    } else {
      setMuteTimeRemaining(null);
    }
  }, [isMuted, muteEndTime]);
  
  // Set up socket event listeners for message status updates
  useEffect(() => {
    if (socket) {
      // Listen for message sent confirmation
      const handleMessageSent = (data: any) => {
        if (data.authorId === currentUserId) {
          setMessageStatus('sent');
          // Auto-clear the message status after 3 seconds
          setTimeout(() => {
            setMessageStatus(null);
          }, 3000);
        }
      };

      // Listen for message error
      const handleMessageError = (data: any) => {
        if (data.authorId === currentUserId) {
          setMessageStatus('error');
          // Auto-clear the error status after 5 seconds
          setTimeout(() => {
            setMessageStatus(null);
          }, 5000);
        }
      };

      socket.on('message_sent', handleMessageSent);
      socket.on('message_error', handleMessageError);

      return () => {
        socket.off('message_sent', handleMessageSent);
        socket.off('message_error', handleMessageError);
      };
    }
  }, [socket, currentUserId]);

  // Parse and handle moderation commands
  const parseModCommand = (text: string) => {
    if (!text.startsWith('/')) return false;
    
    const commandPattern = /^\/([a-z]+)\s+([^\s]+)(?:\s+([^\s]+))?/i;
    const match = text.match(commandPattern);
    
    if (!match) {
      // Check for help command
      if (text === '/help') {
        setShowModCommandHelp(true);
        setTimeout(() => setShowModCommandHelp(false), 10000);
        setContent('');
        return true;
      }
      return false;
    }
    
    const [, command, targetUser, duration] = match;
    
    // Check if user has permission to use this command
    const canUseCommand = (
      (command === 'kick' && userPermissions?.canKickUsers) ||
      (command === 'ban' && userPermissions?.canBanUsers) ||
      (command === 'mute' && userPermissions?.canMuteUsers) ||
      userPermissions?.isAdmin
    );
    
    if (!canUseCommand) {
      setMessageStatus('error');
      setTimeout(() => setMessageStatus(null), 3000);
      return false;
    }
    
    // Execute the command
    if (['kick', 'ban', 'mute'].includes(command) && onModCommand) {
      onModCommand(command, targetUser, duration);
      setContent('');
      return true;
    }
    
    return false;
  };

  const handleSend = () => {
    const trimmedContent = content.trim();
    
    // Check if user is muted
    if (isMuted) {
      setMessageStatus('error');
      setTimeout(() => setMessageStatus(null), 3000);
      return;
    }
    
    // Check for moderation commands
    if (trimmedContent && parseModCommand(trimmedContent)) {
      return;
    }
    
    if ((trimmedContent || attachments.length > 0) && !isLoading) {
      // Set message to sending status
      setMessageStatus('sending');
      
      // If socket exists, emit the message through socket
      if (socket && socket.connected && trimmedContent) {
        socket.emit('new_message', {
          channelId,
          serverId,
          content: trimmedContent,
          authorId: currentUserId,
          replyToId: replyToMessageId,
          attachments,
          mentions
        });
        
        // Clear typing indicator
        socket.emit('typing', {
          channelId,
          userId: currentUserId,
          isTyping: false
        });
      }
      
      // Check for mentions in the content
      const mentionedUserIds = mentions.filter(id => 
        content.includes(`@${serverMembers.find(member => member.id === id)?.name}#${serverMembers.find(member => member.id === id)?.discriminator}`)
      );
      
      onSend(content, attachments, mentionedUserIds);
      setContent('');
      setAttachments([]);
      setMentions([]);
    }
    
    // Close any open pickers
    setShowEmojiPicker(false);
    setShowGifPicker(false);
    setShowMentionSuggestions(false);
  };
  
  const toggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker);
    setShowGifPicker(false);
  };
  
  const toggleGifPicker = () => {
    setShowGifPicker(!showGifPicker);
    setShowEmojiPicker(false);
  };
  
  // Handle markdown formatting
  const handleMarkdownFormat = (format: string) => {
    if (!inputRef.current) return;
    
    const start = inputRef.current.selectionStart;
    const end = inputRef.current.selectionEnd;
    const selectedText = content.substring(start, end);
    
    let formattedText = '';
    let newCursorPos = 0;
    
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        newCursorPos = start + 2;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        newCursorPos = start + 1;
        break;
      case 'strikethrough':
        formattedText = `~~${selectedText}~~`;
        newCursorPos = start + 2;
        break;
      case 'h1':
        formattedText = `# ${selectedText}`;
        newCursorPos = start + 2;
        break;
      case 'h2':
        formattedText = `## ${selectedText}`;
        newCursorPos = start + 3;
        break;
      case 'code':
        formattedText = `\`${selectedText}\``;
        newCursorPos = start + 1;
        break;
      case 'codeblock':
        formattedText = `\`\`\`\n${selectedText}\n\`\`\``;
        newCursorPos = start + 4;
        break;
      case 'quote':
        formattedText = `> ${selectedText}`;
        newCursorPos = start + 2;
        break;
      case 'link':
        formattedText = `[${selectedText}](url)`;
        newCursorPos = start + selectedText.length + 3;
        break;
      case 'list':
        formattedText = `- ${selectedText}`;
        newCursorPos = start + 2;
        break;
      case 'clear':
        // Remove markdown formatting
        formattedText = selectedText
          .replace(/\*\*/g, '')
          .replace(/\*/g, '')
          .replace(/~~/g, '')
          .replace(/^#+ /gm, '')
          .replace(/^> /gm, '')
          .replace(/\[([^\]]*)\]\([^\)]*\)/g, '$1')
          .replace(/^- /gm, '');
        newCursorPos = start;
        break;
      default:
        return;
    }
    
    const newContent = content.substring(0, start) + formattedText + content.substring(end);
    setContent(newContent);
    
    // Set cursor position after formatting
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        if (selectedText) {
          const newEnd = start + formattedText.length;
          inputRef.current.setSelectionRange(newEnd, newEnd);
        } else {
          inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }
    }, 0);
  };
  
  const handleSelectMention = (user: MentionUser) => {
    // Replace the @search with the actual mention
    const before = content.substring(0, mentionPosition.start - 1); // exclude the @ we're replacing
    const after = content.substring(mentionPosition.end);
    const newContent = `${before}@${user.name} ${after}`;
    
    // Add the user ID to mentions array
    setMentions(prev => [...prev, user.id]);
    
    setContent(newContent);
    setShowMentionSuggestions(false);
    
    // Focus back on input and move cursor to the end of the inserted mention
    if (inputRef.current) {
      inputRef.current.focus();
      const newCursorPosition = mentionPosition.start + user.name.length + 1; // +1 for the @ symbol
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.selectionStart = newCursorPosition;
          inputRef.current.selectionEnd = newCursorPosition;
        }
      }, 0);
    }
  };
  
  // Filter server members for mention suggestions
  const filteredMembers = serverMembers.filter(user => 
    user.name.toLowerCase().includes(mentionSearch.toLowerCase())
  ).slice(0, 5); // Limit to 5 suggestions
  
  // Check if socket is connected
  const isSocketConnected = socket && socket.connected;
  
  return (
    <div className="px-4 py-3 bg-gray-800 border-t border-gray-700">
      {replyToMessageId && onCancelReply && (
        <div className="mb-2 px-3 py-2 bg-gray-700 rounded-md flex items-center justify-between">
          <span className="text-sm text-gray-300">Replying to a message</span>
          <button
            onClick={onCancelReply}
            className="text-gray-400 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      )}
      
      {/* Connection status indicator */}
      {socket && !socket.connected && (
        <div className="mb-2 px-3 py-1 bg-yellow-500/20 text-yellow-200 rounded text-xs flex items-center">
          <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Connection offline. Reconnecting...</span>
        </div>
      )}
      
      {/* Message status indicator */}
      {messageStatus && (
        <div className={`mb-2 px-3 py-1 rounded text-xs flex items-center ${
          messageStatus === 'sending' ? 'bg-blue-500/20 text-blue-200' : 
          messageStatus === 'sent' ? 'bg-green-500/20 text-green-200' : 
          'bg-red-500/20 text-red-200'
        }`}>
          {messageStatus === 'sending' && (
            <>
              <svg className="animate-spin w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Sending message...</span>
            </>
          )}
          {messageStatus === 'sent' && (
            <>
              <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Message sent</span>
            </>
          )}
          {messageStatus === 'error' && (
            <>
              <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Error sending message</span>
            </>
          )}
        </div>
      )}
      
      {/* Attachment preview */}
      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachments.map((attachment, index) => (
            <div 
              key={`${attachment.id}-${index}`} 
              className="relative group rounded-md overflow-hidden border border-gray-600"
            >
              {attachment.type === 'gif' && (
                <div className="relative w-32 h-24">
                  <img 
                    src={attachment.previewUrl} 
                    alt={attachment.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                    <button
                      onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                      className="opacity-0 group-hover:opacity-100 bg-red-500 rounded-full p-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-white">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end bg-gray-700 rounded-md overflow-hidden">
        <div className="relative flex-1 bg-gray-700 rounded-md">
          {/* Mute status display */}
          {isMuted && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-90 z-10 rounded-md">
              <div className="text-center p-4">
                <div className="text-red-400 font-semibold mb-1">You are muted</div>
                {muteTimeRemaining ? (
                  <div className="text-gray-300 text-sm">
                    Time remaining: {Math.floor(muteTimeRemaining / 60)}m {muteTimeRemaining % 60}s
                  </div>
                ) : (
                  <div className="text-gray-300 text-sm">Contact an admin for assistance</div>
                )}
              </div>
            </div>
          )}
          
          <textarea
            ref={inputRef}
            value={content}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading || isMuted}
            className="w-full h-full min-h-[40px] max-h-[200px] px-4 py-2 bg-transparent text-white placeholder-gray-400 focus:outline-none resize-none"
          />
        </div>
        
        <div className="flex px-2 py-2">
          {/* Markdown Formatting Buttons - Only shown for users with permissions */}
          {(userPermissions?.canFormatText || userPermissions?.isAdmin) && (
            <div className="flex items-center mr-2">
              <button
                onClick={() => setShowMarkdownButtons(!showMarkdownButtons)}
                className="p-2 rounded-full text-gray-400 hover:text-purple-400 hover:bg-gray-600 transition-colors"
                title="Toggle formatting options"
                type="button"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <path d="M4 7V4h16v3"></path>
                  <path d="M9 20h6"></path>
                  <path d="M12 4v16"></path>
                </svg>
              </button>
              
              {showMarkdownButtons && (
                <div className="absolute bottom-16 left-4 bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-2 flex flex-wrap gap-1 z-10">
                  <button 
                    onClick={() => handleMarkdownFormat('bold')} 
                    className="p-2 rounded text-gray-300 hover:bg-gray-700 hover:text-white"
                    title="Bold"
                  >
                    <FaBold size={16} />
                  </button>
                  <button 
                    onClick={() => handleMarkdownFormat('italic')} 
                    className="p-2 rounded text-gray-300 hover:bg-gray-700 hover:text-white"
                    title="Italic"
                  >
                    <FaItalic size={16} />
                  </button>
                  <button 
                    onClick={() => handleMarkdownFormat('strikethrough')} 
                    className="p-2 rounded text-gray-300 hover:bg-gray-700 hover:text-white"
                    title="Strikethrough"
                  >
                    <BiStrikethrough size={16} />
                  </button>
                  <button 
                    onClick={() => handleMarkdownFormat('h1')} 
                    className="p-2 rounded text-gray-300 hover:bg-gray-700 hover:text-white"
                    title="Heading 1"
                  >
                    <FaHeading size={16} />
                  </button>
                  <button 
                    onClick={() => handleMarkdownFormat('h2')} 
                    className="p-2 rounded text-gray-300 hover:bg-gray-700 hover:text-white"
                    title="Heading 2"
                  >
                    <span className="text-xs font-bold">H2</span>
                  </button>
                  <button 
                    onClick={() => handleMarkdownFormat('code')} 
                    className="p-2 rounded text-gray-300 hover:bg-gray-700 hover:text-white"
                    title="Inline Code"
                  >
                    <FaCode size={16} />
                  </button>
                  <button 
                    onClick={() => handleMarkdownFormat('quote')} 
                    className="p-2 rounded text-gray-300 hover:bg-gray-700 hover:text-white"
                    title="Quote"
                  >
                    <FaQuoteLeft size={16} />
                  </button>
                  <button 
                    onClick={() => handleMarkdownFormat('list')} 
                    className="p-2 rounded text-gray-300 hover:bg-gray-700 hover:text-white"
                    title="List"
                  >
                    <FaListUl size={16} />
                  </button>
                  <button 
                    onClick={() => handleMarkdownFormat('link')} 
                    className="p-2 rounded text-gray-300 hover:bg-gray-700 hover:text-white"
                    title="Link"
                  >
                    <FaLink size={16} />
                  </button>
                  <button 
                    onClick={() => handleMarkdownFormat('clear')} 
                    className="p-2 rounded text-gray-300 hover:bg-gray-700 hover:text-white"
                    title="Clear Formatting"
                  >
                    <MdFormatClear size={16} />
                  </button>
                </div>
              )}
            </div>
          )}
          
          <button
            ref={gifButtonRef}
            onClick={toggleGifPicker}
            className="p-2 rounded-full text-gray-400 hover:text-blue-400 hover:bg-gray-600 transition-colors mx-1"
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M8 21h8"></path>
              <path d="M12 17v4"></path>
              <path d="M7 7h1v2h1V7h1"></path>
              <path d="M10 11v-1"></path>
              <path d="M14 7h3"></path>
              <path d="M14 9h3"></path>
              <path d="M14 11h3"></path>
            </svg>
          </button>
          
          <button
            ref={emojiButtonRef}
            onClick={toggleEmojiPicker}
            className="p-2 rounded-full text-gray-400 hover:text-yellow-400 hover:bg-gray-600 transition-colors mx-1"
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
              <line x1="9" y1="9" x2="9.01" y2="9"></line>
              <line x1="15" y1="9" x2="15.01" y2="9"></line>
            </svg>
          </button>
          
          <button
            onClick={handleSend}
            disabled={(!content.trim() && attachments.length === 0) || isLoading}
            className="ml-1 p-2 rounded-full text-emerald-500 hover:text-emerald-400 hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>
      
      {/* Emoji Picker Popup */}
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className="absolute bottom-20 right-4 z-10"
        >
          <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            {/* Custom emojis section */}
            {customEmojis.length > 0 && (
              <div className="p-2 border-b border-gray-700">
                <h3 className="text-sm font-medium text-gray-300 mb-2">Server Emojis</h3>
                <div className="flex flex-wrap gap-2">
                  {customEmojis.map(emoji => (
                    <button
                      key={emoji.id}
                      onClick={() => handleCustomEmojiClick(emoji)}
                      className="w-8 h-8 rounded hover:bg-gray-700 flex items-center justify-center"
                    >
                      <img 
                        src={emoji.imageUrl} 
                        alt={`:${emoji.name}:`}
                        className="w-6 h-6 object-contain"
                        title={`:${emoji.name}:`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Regular emoji picker */}
            <EmojiPicker 
              onEmojiClick={handleEmojiClick}
              searchPlaceHolder="Search emojis..."
              width={320}
              height={400}
            />
          </div>
        </div>
      )}
      
      {/* Moderation Command Help */}
      {showModCommandHelp && (
        <div className="absolute bottom-20 left-4 z-10 bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-4 max-w-md">
          <h3 className="text-white font-semibold mb-2">Available Moderation Commands:</h3>
          <ul className="text-gray-300 text-sm space-y-2">
            {userPermissions?.canKickUsers && (
              <li><code>/kick @username</code> - Kick a user from the server</li>
            )}
            {userPermissions?.canBanUsers && (
              <li><code>/ban @username</code> - Ban a user from the server</li>
            )}
            {userPermissions?.canMuteUsers && (
              <li><code>/mute @username 5m</code> - Mute a user for a specified duration (s=seconds, m=minutes, h=hours)</li>
            )}
            {userPermissions?.isAdmin && (
              <li><code>/help</code> - Show this help message</li>
            )}
          </ul>
        </div>
      )}
      
      {/* GIF Picker Popup */}
      {showGifPicker && (
        <div
          ref={gifPickerRef}
          className="absolute bottom-20 right-4 z-10 bg-gray-800 border border-gray-700 rounded-lg shadow-lg w-96 max-w-lg"
        >
          <div className="p-3">
            <div className="relative mb-3">
              <input
                type="text"
                value={searchGif}
                onChange={handleGifSearchChange}
                placeholder="Search GIFs..."
                className="w-full bg-gray-700 border-0 rounded-md pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-2.5 w-5 h-5 text-gray-400">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            
            <div className="overflow-y-auto max-h-96 grid grid-cols-2 gap-2">
              {isLoadingGifs && gifs.length === 0 ? (
                <div className="col-span-2 flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                </div>
              ) : gifs.length > 0 ? (
                <>
                  {gifs.map(gif => (
                    <div 
                      key={gif.id}
                      onClick={() => handleGifSelect(gif)}
                      className="cursor-pointer hover:opacity-80 transition-opacity rounded overflow-hidden"
                    >
                      <img 
                        src={gif.previewUrl} 
                        alt={gif.title}
                        className="w-full h-24 object-cover"
                      />
                    </div>
                  ))}
                </>
              ) : (
                <div className="col-span-2 flex justify-center py-8 text-gray-400">
                  {searchGif ? 'No GIFs found' : 'Start typing to search GIFs'}
                </div>
              )}
            </div>
            
            {nextGifPosition && (
              <div className="mt-2 flex justify-center">
                <button
                  onClick={loadMoreGifs}
                  disabled={isLoadingGifs}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-md text-sm disabled:opacity-50"
                >
                  {isLoadingGifs ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Mention Suggestions Popup */}
      {showMentionSuggestions && filteredMembers.length > 0 && (
        <div
          ref={mentionSuggestionsRef}
          className="absolute bottom-20 left-4 z-10 bg-gray-800 border border-gray-700 rounded-lg shadow-lg w-64"
        >
          <ul className="py-1">
            {filteredMembers.map(user => (
              <li key={user.id}>
                <button
                  onClick={() => handleSelectMention(user)}
                  className="w-full px-4 py-2 flex items-center space-x-2 hover:bg-gray-700 text-left"
                >
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-6 h-6 rounded-full" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center">
                      <span className="text-white text-xs">{user.name.substring(0, 2).toUpperCase()}</span>
                    </div>
                  )}
                  <span className="text-white">{user.name}</span>
                  <span className="text-gray-400 text-xs">#{user.discriminator}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="mt-2 text-xs text-gray-400">
        <span>Supports markdown, @mentions, and GIFs</span>
      </div>
    </div>
  );
}; 