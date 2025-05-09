import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';

// GET direct messages between two users
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const friendId = searchParams.get('friendId');
    
    if (!userId || !friendId) {
      return NextResponse.json(
        { error: 'Both user ID and friend ID are required' },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db();
    
    // Find all messages exchanged between these two users
    const messages = await db.collection('direct_messages')
      .find({
        $or: [
          { senderId: userId, recipientId: friendId },
          { senderId: friendId, recipientId: userId }
        ]
      })
      .sort({ createdAt: 1 }) // Sort by timestamp, oldest first
      .toArray();
    
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching direct messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch direct messages' },
      { status: 500 }
    );
  }
}

// POST a new direct message
export async function POST(req: NextRequest) {
  try {
    const { content, senderId, recipientId } = await req.json();
    
    if (!content || !senderId || !recipientId) {
      return NextResponse.json(
        { error: 'Message content, sender ID, and recipient ID are required' },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db();
    
    // Verify both users exist
    const [sender, recipient] = await Promise.all([
      db.collection('users').findOne({ id: senderId }),
      db.collection('users').findOne({ id: recipientId })
    ]);
    
    if (!sender || !recipient) {
      return NextResponse.json(
        { error: 'One or both users not found' },
        { status: 404 }
      );
    }
    
    // Verify they are friends
    const senderFriendIds = sender.friendIds || [];
    if (!senderFriendIds.includes(recipientId)) {
      return NextResponse.json(
        { error: 'Users must be friends to exchange messages' },
        { status: 403 }
      );
    }
    
    // Create the message
    const newMessage = {
      id: uuidv4(),
      content,
      senderId,
      recipientId,
      createdAt: new Date(),
      updatedAt: new Date(),
      read: false,
      edited: false
    };
    
    // Insert the message
    const result = await db.collection('direct_messages').insertOne(newMessage);
    
    return NextResponse.json({
      ...newMessage,
      _id: result.insertedId
    });
  } catch (error) {
    console.error('Error sending direct message:', error);
    return NextResponse.json(
      { error: 'Failed to send direct message' },
      { status: 500 }
    );
  }
} 