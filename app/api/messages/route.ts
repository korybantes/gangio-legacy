import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId, WithId, Document } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string;
  content: string;
  authorId: string;
  channelId: string;
  serverId: string;
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
  isPinned: boolean;
  attachments: any[];
  mentions: string[];
  replyToId?: string;
  replyTo?: Message;
  reactions?: any[];
  _id?: ObjectId;
}

interface User {
  id: string;
  name: string;
  discriminator: string;
  avatarUrl?: string;
  _id?: ObjectId;
  [key: string]: any;
}

// GET handler to fetch messages for a channel with optional pagination
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get('channelId');
    const serverId = searchParams.get('serverId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before'); // Timestamp for pagination
    
    if (!channelId || !serverId) {
      return NextResponse.json(
        { error: 'Channel ID and Server ID are required' },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db();
    
    // Build query
    const query: any = { channelId, serverId };
    
    // Add pagination if 'before' timestamp is provided
    if (before) {
      query.createdAt = { $lt: new Date(parseInt(before)) };
    }
    
    // Fetch messages with pagination, sorted by creation time
    const messages: WithId<Document>[] = await db.collection('messages')
      .find(query)
      .sort({ createdAt: -1 }) // Newest first
      .limit(limit)
      .toArray();
    
    // Fetch authors for messages
    const authorIds = Array.from(new Set(messages.map((message) => message.authorId as string)));
    
    const authors: WithId<Document>[] = await db.collection('users')
      .find({ id: { $in: authorIds } })
      .toArray();
    
    // Create a lookup map for authors, casting author to User
    const authorMap = authors.reduce((map: Record<string, User>, authorDoc: WithId<Document>) => {
      const author = authorDoc as User;
      map[author.id] = author;
      return map;
    }, {});
    
    // Enrich messages with author data, casting message to Message
    const enrichedMessages = messages.map((messageDoc: WithId<Document>) => {
      const message = messageDoc as Message;
      return {
        ...message,
        author: authorMap[message.authorId] || { 
          id: message.authorId,
          name: 'Unknown User',
          discriminator: '0000'
        }
      }
    });
    
    // Check for reply message IDs and fetch those messages
    // Cast msg to Message for type safety
    const replyIds = enrichedMessages
      .filter((msg: any) => msg.replyToId)
      .map((msg: any) => msg.replyToId);
    
    if (replyIds.length > 0) {
      const replyMessagesDocs: WithId<Document>[] = await db.collection('messages')
        .find({ id: { $in: replyIds } })
        .toArray();
      
      // Enrich reply messages with author data, casting message to Message
      const enrichedReplyMessages = replyMessagesDocs.map((replyDoc: WithId<Document>) => {
        const message = replyDoc as Message;
        return {
          ...message,
          author: authorMap[message.authorId] || { 
            id: message.authorId,
            name: 'Unknown User',
            discriminator: '0000'
          }
        }
      });
        
      // Create a lookup map for reply messages, casting message to Message
      const replyMap = enrichedReplyMessages.reduce((map: Record<string, Message>, message: Message) => {
        if (message.id) {
          map[message.id] = message;
        }
        return map;
      }, {});
      
      // Add reply messages to their parent messages, casting message to Message
      enrichedMessages.forEach((message: any) => {
        if (message.replyToId && replyMap[message.replyToId]) {
          message.replyTo = replyMap[message.replyToId];
        }
      });
    }
    
    // Sort in reverse order to display oldest first (for the client)
    return NextResponse.json(enrichedMessages.reverse());
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST handler to create a new message
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content, authorId, channelId, serverId, attachments, mentions, replyToId } = body;
    
    if (!content || !authorId || !channelId || !serverId) {
      return NextResponse.json(
        { error: 'Content, author ID, channel ID, and server ID are required' },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db();
    
    // Get the author info
    const author = await db.collection('users').findOne({ id: authorId });
    
    if (!author) {
      return NextResponse.json(
        { error: 'Author not found' },
        { status: 404 }
      );
    }
    
    // Create new message object
    const now = new Date();
    const message: Message = {
      id: uuidv4(),
      content,
      authorId,
      channelId,
      serverId,
      createdAt: now,
      updatedAt: now,
      isEdited: false,
      isPinned: false,
      attachments: attachments || [],
      mentions: mentions || [],
      replyToId
    };
    
    // Insert the message
    await db.collection('messages').insertOne(message);
    
    // If this is a reply, fetch the original message
    let replyTo = null;
    if (replyToId) {
      const originalMessage = await db.collection('messages').findOne({ id: replyToId });
      if (originalMessage) {
        // Get the original message author
        const originalAuthor = await db.collection('users').findOne({ id: originalMessage.authorId });
        replyTo = {
          ...originalMessage,
          author: originalAuthor || {
            id: originalMessage.authorId,
            name: 'Unknown User',
            discriminator: '0000'
          }
        };
      }
    }
    
    // Return the complete message with author info
    return NextResponse.json({
      ...message,
      author,
      replyTo
    });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    );
  }
}

// PATCH /api/messages/:messageId - Edit a message
export async function PATCH(req: NextRequest) {
  try {
    const { messageId, content, authorId } = await req.json();
    
    if (!messageId || !content || !authorId) {
      return NextResponse.json(
        { error: 'Message ID, content, and author ID are required' },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db();
    
    // Check if message exists
    const message = await db.collection('messages').findOne({ id: messageId });
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }
    
    // Check if the user is the author of the message
    if (message.authorId !== authorId) {
      return NextResponse.json(
        { error: 'You can only edit your own messages' },
        { status: 403 }
      );
    }
    
    // Update message
    await db.collection('messages').updateOne(
      { id: messageId },
      {
        $set: {
          content,
          edited: true,
          updatedAt: new Date()
        }
      }
    );
    
    // Get updated message
    const updatedMessage = await db.collection('messages').findOne({ id: messageId });
    
    // Get author data
    const author = await db.collection('users').findOne({ id: authorId });
    
    if (author) {
      const { passwordHash, ...authorData } = author;
      return NextResponse.json({
        ...updatedMessage,
        author: authorData
      });
    }
    
    return NextResponse.json(updatedMessage);
  } catch (error) {
    console.error('Error updating message:', error);
    return NextResponse.json(
      { error: 'Failed to update message' },
      { status: 500 }
    );
  }
}

// DELETE /api/messages/:messageId - Delete a message
export async function DELETE(req: NextRequest) {
  try {
    const { messageId, authorId } = await req.json();
    
    if (!messageId || !authorId) {
      return NextResponse.json(
        { error: 'Message ID and author ID are required' },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db();
    
    // Check if message exists
    const message = await db.collection('messages').findOne({ id: messageId });
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }
    
    // Check if the user is the author of the message
    if (message.authorId !== authorId) {
      // Check if user has admin rights
      const member = await db.collection('serverMembers').findOne({
        serverId: message.serverId,
        userId: authorId
      });
      
      if (member) {
        // Check if user has admin role
        const adminRoles = await db.collection('roles').find({
          id: { $in: member.roleIds || [] },
          permissions: 'ADMINISTRATOR'
        }).toArray();
        
        if (adminRoles.length === 0) {
          return NextResponse.json(
            { error: 'You can only delete your own messages or need administrator permissions' },
            { status: 403 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'User is not a member of this server' },
          { status: 403 }
        );
      }
    }
    
    // Delete message
    await db.collection('messages').deleteOne({ id: messageId });
    
    return NextResponse.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    );
  }
} 