import { Injectable, UnauthorizedException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.model';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleAuthService {
  private client: OAuth2Client;

  constructor(
    private usersService: UsersService,
    private configService: ConfigService,
  ) {
    this.client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      // Client Secret 在只验证 idToken 时其实不需要
    );
  }

  async verifyIdToken(idToken: string) {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
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
    // 重要：使用 withPassword scope 来获取完整用户信息，以便正确判断 provider
    let user = await User.scope('withPassword').findOne({
      where: { email: googleData.email },
    });

    if (user) {
      // 用户存在 - 检查是否需要更新 Google 信息
      if (!user.googleId) {
        user.googleId = googleData.googleId;
        // 现在能正确判断了，因为我们用了 withPassword scope
        user.provider = user.password ? 'both' : 'google';
        await user.save();
      }
    } else {
      // 新用户 - 创建 Google 账号
      user = await User.create({
        email: googleData.email,
        googleId: googleData.googleId,
        firstName: googleData.firstName,
        lastName: googleData.lastName,
        provider: 'google',
        // 注意：没有密码
      });
    }

    // 返回时使用默认 scope（不包含密码）
    return User.findByPk(user.id) as Promise<User>;
  }
}
