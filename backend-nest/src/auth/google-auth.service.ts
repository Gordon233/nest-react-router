import { Injectable, UnauthorizedException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.model';

@Injectable()
export class GoogleAuthService {
  private client: OAuth2Client;

  constructor(private usersService: UsersService) {
    this.client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      // Client Secret 在只验证 idToken 时其实不需要
    );
  }

  async verifyIdToken(idToken: string) {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new UnauthorizedException('Invalid token payload');
      }

      return {
        googleId: payload.sub,
        email: payload.email!,
        emailVerified: payload.email_verified,
        firstName: payload.given_name || '',
        lastName: payload.family_name || '',
        picture: payload.picture,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid Google token');
    }
  }

  async handleGoogleUser(googleData: {
    googleId: string;
    email: string;
    firstName: string;
    lastName: string;
  }): Promise<User> {
    // 先按 email 查找用户
    let user = await User.findByEmail(googleData.email);

    if (user) {
      // 用户存在 - 更新 Google 信息
      if (!user.googleId) {
        user.googleId = googleData.googleId;
        user.provider = user.password ? 'both' : 'google';
        await user.save();
      }
    } else {
      // 新用户 - 创建
      user = await User.create({
        email: googleData.email,
        googleId: googleData.googleId,
        firstName: googleData.firstName,
        lastName: googleData.lastName,
        provider: 'google',
        // 注意：没有密码！
        // 但 Sequelize 可能要求 password 字段，所以需要改 Model
      });
    }

    return user;
  }
}
