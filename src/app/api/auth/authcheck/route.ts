import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('accessToken')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secret'
    ) as { id: string };

    await connectToDatabase();
    
    // Find the user
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });

  } catch (error: any) {
    // If the token is expired or invalid, we return 401. 
    // The client can then try to hit the refresh endpoint.
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
}
