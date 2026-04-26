import jwt from 'jsonwebtoken';

export function generateTokens(userId: string) {
  const accessToken = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '15m' }
  );
  
  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET || 'refreshsecret',
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
}
