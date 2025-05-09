import { NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';

export async function POST(req: Request) {
  try {
    // Get token from request body
    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Verify token
    const secret = process.env.NEXTAUTH_SECRET || "your-fallback-secret-key";
    const payload = verify(token, secret);
    
    // Check if token has admin role
    if (payload && (payload as any).isAdmin) {
      return NextResponse.json({ isAdmin: true });
    } else {
      return NextResponse.json({ isAdmin: false });
    }
  } catch (error) {
    console.error('Error verifying admin token:', error);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
