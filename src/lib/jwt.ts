import jwt from "jsonwebtoken";

const ACCESS_SECRET =
  process.env.JWT_SECRET || "secret";

const REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "refreshsecret";

export function generateTokens(userId: string) {
  const accessToken = jwt.sign(
    { id: userId },
    ACCESS_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { id: userId },
    REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  return { accessToken, refreshToken };
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, ACCESS_SECRET) as { id: string };
  } catch (err) {
    return null;
  }
}

export function verifyRefreshToken(token: string) {
  try {
    return jwt.verify(token, REFRESH_SECRET) as { id: string };
  } catch (err) {
    return null;
  }
}