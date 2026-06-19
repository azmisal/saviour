import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { verifyRefreshToken } from '@/lib/jwt';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get('refreshToken')?.value;

  if (refreshToken) {
    const decoded = verifyRefreshToken(refreshToken);

    if (decoded) {
      try {
        await connectToDatabase();
        await User.findByIdAndUpdate(decoded.id, {
          $unset: { refreshTokenHash: '' },
        });
      } catch (error) {
        console.error('Logout cleanup error:', error);
      }
    }
  }

  const response = NextResponse.json({ message: 'Logged out' });

  response.cookies.set('accessToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });

  response.cookies.set('refreshToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });

  return response;
}
