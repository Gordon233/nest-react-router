// backend-nest/src/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { UserJSON } from '../users/user.model';

// 直接用 User 实例的 toJSON 返回类型
type UserWithoutPassword = Omit<UserJSON, 'password'>;

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<UserWithoutPassword | null> {
    console.log('[AUTH SERVICE DEBUG] Validating user:', { email });
    
    const user = await this.usersService.findByEmailWithPassword(email);
    console.log('[AUTH SERVICE DEBUG] User found:', !!user);
    
    if (user && (await user.verifyPassword(password))) {
      console.log('[AUTH SERVICE DEBUG] Password validation success for user:', user.email);
      return user.toJSON();
    }
    console.log('[AUTH SERVICE DEBUG] Password validation failed or user not found');
    return null;
  }

  login(user: UserWithoutPassword) {
    console.log('[AUTH SERVICE DEBUG] Creating JWT token for user:', { 
      email: user.email, 
      id: user.id 
    });
    
    const payload = {
      email: user.email,
      sub: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      version: user.tokenVersion || 1,
    };

    console.log('[AUTH SERVICE DEBUG] JWT payload:', payload);
    
    const access_token = this.jwtService.sign(payload);
    console.log('[AUTH SERVICE DEBUG] JWT token generated, length:', access_token.length);

    return {
      access_token,
      user: user,
    };
  }
}
