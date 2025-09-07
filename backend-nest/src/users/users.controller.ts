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
} from '@nestjs/common';
import { User } from './user.model';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UniqueConstraintError, ValidationError } from 'sequelize';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(): Promise<User[]> {
    return User.findAll();
  }

  @Get('active')
  async findActive(): Promise<User[]> {
    return User.findActive();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<User> {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  @Post()
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
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateUserDto: UpdateUserDto,
  ): Promise<User> {
    const user = await User.findByPk(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await user.update(updateUserDto);
    return user;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    const user = await User.findByPk(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    await user.destroy();
  }

  @Post(':id/deactivate')
  async deactivate(@Param('id', ParseIntPipe) id: number): Promise<User> {
    const user = await User.findByPk(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    await user.deactivate();
    return user;
  }

  @Post(':id/activate')
  async activate(@Param('id', ParseIntPipe) id: number): Promise<User> {
    const user = await User.findByPk(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    await user.activate();
    return user;
  }

  @Post(':id/change-password')
  async changePassword(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    // 使用服务层处理复杂逻辑
    return this.usersService.changePassword(id, changePasswordDto);
  }
}
