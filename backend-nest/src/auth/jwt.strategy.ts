import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Request } from 'express';
import { jwtConstants } from './constants';
import { UsersService } from '../users/users.service';

interface JwtPayload {
  sub: number;
  email: string;
  firstName: string;
  lastName: string;
  version: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          const cookies = request?.cookies as
            | Record<string, string>
            | undefined;
          console.log('[JWT STRATEGY DEBUG] Extracting token from cookies:', {
            allCookies: cookies,
            targetCookie: jwtConstants.cookieName,
            foundToken: !!cookies?.[jwtConstants.cookieName],
            tokenLength: cookies?.[jwtConstants.cookieName]?.length || 0
          });
          return cookies?.[jwtConstants.cookieName] || null;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload: JwtPayload) {
    console.log('[JWT STRATEGY DEBUG] Validating JWT payload:', {
      sub: payload.sub,
      email: payload.email,
      version: payload.version
    });
    
    // payload是JWT解码后的内容
    // 这里可以加载更多用户信息，或者只返回基本信息
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      console.log('[JWT STRATEGY DEBUG] User not found for ID:', payload.sub);
      throw new UnauthorizedException();
    }

    console.log('[JWT STRATEGY DEBUG] User found:', {
      userId: user.id,
      email: user.email,
      tokenVersion: user.tokenVersion
    });

    // 关键检查：版本号必须匹配
    if (!payload.version || user.tokenVersion !== payload.version) {
      console.log('[JWT STRATEGY DEBUG] Token version mismatch:', {
        payloadVersion: payload.version,
        userTokenVersion: user.tokenVersion
      });
      throw new UnauthorizedException('Token has been invalidated');
    }

    console.log('[JWT STRATEGY DEBUG] JWT validation successful');
    
    // 返回的内容会被注入到 request.user
    return {
      userId: payload.sub,
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
    };
  }
}

// 把这个隐藏的调用链展示清楚
// 用户请求 /auth/me
//     ↓
// @UseGuards(JwtAuthGuard)  // 你看得见的部分
//     ↓
// AuthGuard('jwt')          // 父类处理
//     ↓
// Passport寻找名为'jwt'的策略  // 隐藏的部分开始
//     ↓
// 找到JwtStrategy（因为继承自PassportStrategy）
//     ↓
// 调用JwtStrategy的配置（从cookie提取token）
//     ↓
// 验证token有效性
//     ↓
// 调用JwtStrategy.validate()
//     ↓
// 返回值注入到req.user
//     ↓
// 你的controller方法执行

// 完整的时序
// 应用启动
//   ↓
// NestJS扫描AuthModule的providers
//   ↓
// 发现JwtStrategy，创建实例
//   ↓
// 调用new JwtStrategy(usersService)
//   ↓
// 构造函数中的super()执行
//   ↓
// Passport注册了一个名为'jwt'的策略
//   ↓
// 应用启动完成，等待请求
//   ↓
// 请求到达 @UseGuards(JwtAuthGuard)
//   ↓
// JwtAuthGuard调用AuthGuard('jwt')
//   ↓
// Passport查找名为'jwt'的策略
//   ↓
// 找到了！使用JwtStrategy验证
