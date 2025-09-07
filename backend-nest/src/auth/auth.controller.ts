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

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto, @Res() res: Response) {
    // 检查邮箱是否已存在
    const existingUser = await User.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // 创建用户
    const user = await User.create({ ...createUserDto });
    const userWithoutPassword = await User.findByPk(user.id);

    // 生成token并设置cookie
    const loginResult = this.authService.login(userWithoutPassword!.toJSON());

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
}
