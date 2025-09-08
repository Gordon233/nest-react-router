// src/users/users.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  NotFoundException,
  ConflictException,
  BadRequestException,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  ValidationPipe,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiBearerAuth } from '@nestjs/swagger';
import { User } from './user.model';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UniqueConstraintError, ValidationError } from 'sequelize';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Request } from 'express';
import type { AuthRequest } from '../auth/interfaces/jwt-user.interface';
import { UserResponseDto } from './dto/user-response.dto';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: '获取所有用户' })
  @ApiOkResponse({ type: [UserResponseDto] })
  async findAll(): Promise<User[]> {
    return User.findAll();
  }

  @Get('active')
  async findActive(): Promise<User[]> {
    return User.findActive();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个用户' })
  @ApiOkResponse({ type: UserResponseDto })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<User> {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  @Post()
  @ApiOperation({ summary: '创建用户' })
  @ApiOkResponse({ type: UserResponseDto })
  async create(
    @Body(ValidationPipe) createUserDto: CreateUserDto,
  ): Promise<User> {
    try {
      // 检查邮箱是否已存在
      const existingUser = await User.findByEmail(createUserDto.email);
      if (existingUser) {
        throw new ConflictException('Email already exists');
      }

      // 使用展开运算符解决类型问题
      const user = await User.create({ ...createUserDto });

      // 重新查询以确保不返回密码
      return User.findByPk(user.id) as Promise<User>;
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        throw new ConflictException('Email already exists');
      }
      if (error instanceof ValidationError) {
        throw new BadRequestException(
          error.errors[0]?.message || 'Validation failed',
        );
      }
      throw error;
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新用户' })
  @ApiOkResponse({ type: UserResponseDto })
  async update(
    @Req() req: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateUserDto: UpdateUserDto,
  ): Promise<User> {
    if (req.user.userId !== id) {
      throw new ForbiddenException('You can only update your own profile');
    }

    const user = await User.findByPk(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await user.update(updateUserDto);
    return user;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Req() req: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    if (req.user.userId !== id) {
      throw new ForbiddenException('You can only delete your own account');
    }

    const user = await User.findByPk(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    await user.destroy();
  }

  @Post(':id/deactivate')
  async deactivate(
    @Req() req: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<User> {
    if (req.user.userId !== id) {
      throw new ForbiddenException('You can only deactivate your own account');
    }

    const user = await User.findByPk(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    await user.deactivate();
    return user;
  }

  @Post(':id/activate')
  async activate(
    @Req() req: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<User> {
    if (req.user.userId !== id) {
      throw new ForbiddenException('You can only activate your own account');
    }

    const user = await User.findByPk(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    await user.activate();
    return user;
  }

  @Post(':id/change-password')
  async changePassword(
    @Req() req: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    if (req.user.userId !== id) {
      throw new ForbiddenException('You can only change your own password');
    }
    // 使用服务层处理复杂逻辑
    return this.usersService.changePassword(id, changePasswordDto);
  }

  @Get(':id/password-status')
  async getPasswordStatus(
    @Req() req: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ hasPassword: boolean; provider: string }> {
    if (req.user.userId !== id) {
      throw new ForbiddenException(
        'You can only check your own password status',
      );
    }

    const user = await User.scope('withPassword').findByPk(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return {
      hasPassword: !!user.password,
      provider: user.provider,
    };
  }
}
