// src/users/users.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './user.model';
import { Sequelize } from 'sequelize-typescript';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
    private sequelize: Sequelize,
  ) {}

  async findById(id: number): Promise<User | null> {
    return User.findByPk(id);
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return User.findByEmailWithPassword(email);
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await User.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const user = await User.create({ ...createUserDto });
    return User.findByPk(user.id) as Promise<User>;
  }

  // 修改密码逻辑
  async changePassword(
    userId: number,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const user = await User.scope('withPassword').findByPk(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // 如果用户有密码，验证当前密码
    if (user.password) {
      const isValid = await user.verifyPassword(
        changePasswordDto.currentPassword,
      );
      if (!isValid) {
        throw new BadRequestException('Current password is incorrect');
      }
    }
    // 如果是 Google 用户（没密码），允许直接设置新密码
    else {
      // 更新 provider 为 'both'
      user.provider = 'both';
    }

    await user.changePassword(changePasswordDto.newPassword);
    return { message: 'Password changed successfully' };
  }

  // 批量操作
  async bulkDeactivate(userIds: number[]) {
    const users = await User.findAll({
      where: { id: userIds },
    });

    await Promise.all(users.map((user) => user.deactivate()));
  }

  // 获取用户统计
  async getUserStats() {
    const [totalUsers, activeUsers] = await Promise.all([
      User.count(),
      User.count({ where: { isActive: true } }),
    ]);

    return {
      total: totalUsers,
      active: activeUsers,
      inactive: totalUsers - activeUsers,
    };
  }
}
