import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.model';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await User.findByEmailWithPassword(email);
    if (user && (await user.verifyPassword(password))) {
      // 返回用户信息（不包含密码）
      const { password: _, ...result } = user.toJSON();
      return result;
    }
    return null;
  }

  async login(user: any) {
    // 创建JWT payload
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
