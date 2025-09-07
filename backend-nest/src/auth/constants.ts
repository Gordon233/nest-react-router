export const jwtConstants = {
  secret:
    process.env.JWT_SECRET || 'your-super-secret-key-change-in-production',
  expiresIn: '7d',
  cookieName: 'access_token',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // 生产环境才用https
    sameSite: 'strict' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7天（毫秒）
    path: '/',
  },
};
