import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';

interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  avatarUrl?: string;
  status?: string;
  [key: string]: any; // For any additional fields
}

interface FriendRequest {
  id: string;
  senderId: string;
  recipientId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

interface SafeUser extends Omit<User, 'passwordHash'> {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  status?: string;
}

// POST endpoint for sending a friend request
export async function POST(req: NextRequest) {
  try {
    const { senderId, recipientId } = await req.json();
    
    if (!senderId || !recipientId) {
      return NextResponse.json(
        { error: 'Both sender and recipient IDs are required' },
        { status: 400 }
      );
    }
    
    // Don't allow sending a request to yourself
    if (senderId === recipientId) {
      return NextResponse.json(
        { error: 'Cannot send a friend request to yourself' },
        { status: 400 }
      );
    }
    
    const db = await connectToDatabase();
    
    // Get both users
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
    
    // Check if they are already friends
    const senderFriendIds = sender.friendIds || [];
    if (senderFriendIds.includes(recipientId)) {
      return NextResponse.json(
        { error: 'Users are already friends' },
        { status: 400 }
      );
    }
    
    // Check if there's already a pending request
    const senderOutgoingRequests = sender.outgoingFriendRequests || [];
    const recipientIncomingRequests = recipient.incomingFriendRequests || [];
    
    if (senderOutgoingRequests.includes(recipientId) || recipientIncomingRequests.includes(senderId)) {
      return NextResponse.json(
        { error: 'Friend request already sent' },
        { status: 400 }
      );
    }
    
    // Update sender's outgoing requests
    const senderUpdate = await db.collection('users').updateOne(
      { id: senderId },
      { 
        $set: { updatedAt: new Date() },
        $push: { outgoingFriendRequests: recipientId } 
      }
    );
    
    // Update recipient's incoming requests
    const recipientUpdate = await db.collection('users').updateOne(
      { id: recipientId },
      { 
        $set: { updatedAt: new Date() },
        $push: { incomingFriendRequests: senderId } 
      }
    );
    
    if (senderUpdate.matchedCount === 0 || recipientUpdate.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to update users' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Friend request sent successfully'
    });
  } catch (error) {
    console.error('Error sending friend request:', error);
    return NextResponse.json(
      { error: 'Failed to send friend request' },
      { status: 500 }
    );
  }
}

// GET endpoint for retrieving a user's friend requests
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type') || 'received'; // 'received' or 'sent'

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();

    // Find friend requests based on type
    const requests = await db.collection('friend_requests').find({
      [type === 'received' ? 'recipientId' : 'senderId']: userId,
      status: 'pending'
    }).toArray() as FriendRequest[];

    if (!requests.length) {
      return NextResponse.json({ requests: [] });
    }

    // Get user IDs from requests
    const userIds = requests.map((request: FriendRequest) => 
      type === 'received' ? request.senderId : request.recipientId
    );

    // Get user details
    const requestUsers = await db.collection('users')
      .find({ id: { $in: userIds } })
      .toArray() as User[];

    // Remove sensitive information
    const safeUsers = requestUsers.map((reqUser: User): SafeUser => {
      const { passwordHash, ...safeUser } = reqUser;
      return safeUser;
    });

    return NextResponse.json({
      requests: requests.map((request: FriendRequest) => ({
        ...request,
        user: safeUsers.find((user: SafeUser) => 
          user.id === (type === 'received' ? request.senderId : request.recipientId)
        )
      }))
    });
  } catch (error) {
    console.error('Error fetching friend requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch friend requests' },
      { status: 500 }
    );
  }
}

// DELETE endpoint for canceling a friend request
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const senderId = searchParams.get('senderId');
    const recipientId = searchParams.get('recipientId');
    
    if (!senderId || !recipientId) {
      return NextResponse.json(
        { error: 'Both sender and recipient IDs are required' },
        { status: 400 }
      );
    }
    
    const db = await connectToDatabase();
    
    // Get both users
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
    
    // Verify there is a pending request
    const senderOutgoingRequests = sender.outgoingFriendRequests || [];
    const recipientIncomingRequests = recipient.incomingFriendRequests || [];
    
    if (!senderOutgoingRequests.includes(recipientId) || !recipientIncomingRequests.includes(senderId)) {
      return NextResponse.json(
        { error: 'No pending friend request found' },
        { status: 400 }
      );
    }
    
    // Remove request from both users
    const updates = await Promise.all([
      db.collection('users').updateOne(
        { id: senderId },
        { 
          $set: { updatedAt: new Date() },
          $pull: { outgoingFriendRequests: recipientId } 
        } as any
      ),
      db.collection('users').updateOne(
        { id: recipientId },
        { 
          $set: { updatedAt: new Date() },
          $pull: { incomingFriendRequests: senderId } 
        } as any
      )
    ]);
    
    if (updates[0].matchedCount === 0 || updates[1].matchedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to update users' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Friend request canceled successfully'
    });
  } catch (error) {
    console.error('Error canceling friend request:', error);
    return NextResponse.json(
      { error: 'Failed to cancel friend request' },
      { status: 500 }
    );
  }
} 