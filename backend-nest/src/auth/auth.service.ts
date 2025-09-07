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
    const user = await this.usersService.findByEmailWithPassword(email);
    if (user && (await user.verifyPassword(password))) {
      return user.toJSON();
    }
    return null;
  }

  login(user: UserWithoutPassword) {
    const payload = {
      email: user.email,
      sub: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: user,
    };
  }
}
