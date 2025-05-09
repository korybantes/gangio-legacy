import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// Valid status types
type UserStatus = 'online' | 'idle' | 'dnd' | 'offline' | 'focus' | 'invisible';

// PATCH /api/users/status - Update user status
export async function PATCH(req: NextRequest) {
  try {
    const { userId, status } = await req.json();
    
    if (!userId || !status) {
      return NextResponse.json(
        { error: 'User ID and status are required' },
        { status: 400 }
      );
    }
    
    const validStatuses: UserStatus[] = ['online', 'idle', 'dnd', 'offline', 'focus', 'invisible'];
    if (!validStatuses.includes(status as UserStatus)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db();
    
    // Update user status
    const result = await db.collection('users').updateOne(
      { id: userId },
      { 
        $set: { 
          status, 
          updatedAt: new Date() 
        } 
      }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'User status updated successfully'
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    return NextResponse.json(
      { error: 'Failed to update user status' },
      { status: 500 }
    );
  }
}

// POST /api/users/status - Alias for PATCH for compatibility
export async function POST(req: NextRequest) {
  return PATCH(req);
} 