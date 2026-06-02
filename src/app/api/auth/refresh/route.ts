import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { generateTokens } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get('refreshToken')?.value;

    if (!refreshToken) {
      return NextResponse.json({ error: 'No refresh token provided' }, { status: 401 });
    }

    // Verify token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || 'refreshsecret'
    ) as { id: string };

    await connectToDatabase();

    // Check if the user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return NextResponse.json({ error: 'User no longer exists' }, { status: 401 });
    }

    // Generate new tokens
    // We update both access and refresh tokens to prevent token reuse attacks
    const tokens = generateTokens(user._id.toString());

    const response = NextResponse.json(
      {
        message: 'Token refreshed successfully',
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
        },
        salt: user.salt,
      },
      { status: 200 }
    );

    // Set new cookies
    response.cookies.set('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60, // 15 minutes
      path: '/'
    });

    response.cookies.set('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    });

    return response;

  } catch (error: any) {
    return NextResponse.json({ error: 'Invalid or expired refresh token' }, { status: 401 });
  }
}
