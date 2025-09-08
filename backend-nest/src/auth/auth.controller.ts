// src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  Res,
  UseGuards,
  Get,
  Req,
  HttpCode,
  HttpStatus,
  ConflictException,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { jwtConstants } from './constants';
import { User } from '../users/user.model';
import type { AuthRequest } from './interfaces/jwt-user.interface';
import { GoogleAuthService } from './google-auth.service';
import { GoogleLoginDto } from './dto/google-login.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private googleAuthService: GoogleAuthService,
  ) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto, @Res() res: Response) {
    // 查找是否已存在该邮箱的用户（需要包含password字段来判断）
    const existingUser = await User.scope('withPassword').findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      // 情况1: 用户已经有密码 - 真正的重复注册
      if (existingUser.password) {
        throw new ConflictException('Email already registered with password');
      }

      // 情况2: Google用户想设置密码
      // 验证其他必填字段是否匹配（可选，看你的业务需求）
      if (existingUser.email !== createUserDto.email) {
        throw new ConflictException(
          'An account with this email exists. Please login with Google first, then set a password in your profile.',
        );
      }

      // 允许Google用户设置密码
      existingUser.password = createUserDto.password; // 会自动触发 @BeforeUpdate hook 加密
      existingUser.provider = 'both';

      // 更新可选字段
      if (createUserDto.phone) existingUser.phone = createUserDto.phone;
      if (createUserDto.gender) existingUser.gender = createUserDto.gender;

      await existingUser.save();

      // 生成token并设置cookie（与正常注册一样）
      const userWithoutPassword = await User.findByPk(existingUser.id);
      const loginResult = this.authService.login(userWithoutPassword!.toJSON());

      res.cookie(
        jwtConstants.cookieName,
        loginResult.access_token,
        jwtConstants.cookieOptions,
      );

      res.json({
        user: loginResult.user,
        access_token: loginResult.access_token,
        message: 'Password added to your Google account successfully',
      });
      return;
    }

    // 情况3: 全新用户注册
    const newUser = await User.create({
      ...createUserDto,
      provider: 'local', // 明确设置为local
    });

    const userWithoutPassword = await User.findByPk(newUser.id);
    const loginResult = this.authService.login(userWithoutPassword!.toJSON());

    res.cookie(
      jwtConstants.cookieName,
      loginResult.access_token,
      jwtConstants.cookieOptions,
    );

    res.json({
      user: loginResult.user,
      access_token: loginResult.access_token,
    });
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );

    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const loginResult = this.authService.login(user);
    res.cookie(
      jwtConstants.cookieName,
      loginResult.access_token,
      jwtConstants.cookieOptions,
    );
    res.json({
      user: loginResult.user,
      access_token: loginResult.access_token, // Mobile need
    });
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res() res: Response) {
    res.clearCookie(jwtConstants.cookieName);
    res.json({ message: 'Logged out successfully' });
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Req() req: Request) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-all-devices')
  @HttpCode(HttpStatus.OK)
  async logoutAllDevices(@Req() req: AuthRequest, @Res() res: Response) {
    const userId = req.user.userId;
    const user = await this.usersService.findById(userId);

    if (user) {
      await user.invalidateAllTokens();
    }

    // 清除当前设备的 cookie
    res.clearCookie(jwtConstants.cookieName);
    res.json({ message: 'Logged out from all devices' });
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  async googleLogin(
    @Body() googleLoginDto: GoogleLoginDto,
    @Res() res: Response,
  ) {
    // 1. 验证 Google token
    const googleData = await this.googleAuthService.verifyIdToken(
      googleLoginDto.idToken,
    );

    // 2. 查找或创建用户
    const user = await this.googleAuthService.handleGoogleUser(googleData);

    // 3. 生成我们自己的 JWT
    const loginResult = this.authService.login(user.toJSON());

    // 4. 设置 cookie（Web用）并返回 token（Mobile用）
    res.cookie(
      jwtConstants.cookieName,
      loginResult.access_token,
      jwtConstants.cookieOptions,
    );

    res.json({
      user: loginResult.user,
      access_token: loginResult.access_token,
    });
  }
}
