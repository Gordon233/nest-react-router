export interface JwtUser {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
}

export interface AuthRequest extends Request {
  user: JwtUser;
}
