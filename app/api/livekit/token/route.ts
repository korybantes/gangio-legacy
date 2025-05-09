import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import clientPromise from '@/lib/mongodb';

// POST /api/livekit/token - Generate a LiveKit token for a user to join a room
export async function POST(req: NextRequest) {
  try {
    const { userId, channelId } = await req.json();
    
    if (!userId || !channelId) {
      return NextResponse.json(
        { error: 'User ID and channel ID are required' },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db();
    
    // Get user data
    const user = await db.collection('users').findOne({ id: userId });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Get channel data
    const channel = await db.collection('channels').findOne({ id: channelId });
    
    if (!channel) {
      return NextResponse.json(
        { error: 'Channel not found' },
        { status: 404 }
      );
    }
    
    // Check if channel type is voice or video
    if (channel.type !== 'voice' && channel.type !== 'video') {
      return NextResponse.json(
        { error: 'Channel is not a voice or video channel' },
        { status: 400 }
      );
    }
    
    // Check if user is a member of the server
    const serverMember = await db.collection('serverMembers').findOne({
      userId: userId,
      serverId: channel.serverId
    });
    
    if (!serverMember) {
      return NextResponse.json(
        { error: 'User is not a member of this server' },
        { status: 403 }
      );
    }
    
    // Generate a room name based on the channel ID
    const roomName = `channel_${channelId}`;
    
    // Create token with user's identity
    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY!,
      process.env.LIVEKIT_API_SECRET!,
      {
        identity: userId,
        name: user.name,
        ttl: '1h' // Token expires after 1 hour
      }
    );
    
    // Add permissions to join the room
    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true
    });
    
    // Generate JWT token
    const token = await at.toJwt();
    
    return NextResponse.json({
      token,
      roomName,
      serverUrl: process.env.NEXT_PUBLIC_LIVEKIT_URL
    });
  } catch (error) {
    console.error('Error generating LiveKit token:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
} 