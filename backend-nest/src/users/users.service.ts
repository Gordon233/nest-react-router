// src/users/users.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './user.model';
import { Sequelize } from 'sequelize-typescript';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

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

  // 登录逻辑
  async login(loginDto: LoginDto): Promise<{
    message: string;
    user: User;
  }> {
    const user = await this.userModel.findByEmailWithPassword(loginDto.email);
    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }

    // 使用模型的方法验证密码
    const isPasswordValid = await user.verifyPassword(loginDto.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid credentials');
    }

    // 返回不包含密码的用户对象
    const userWithoutPassword = await User.findByPk(user.id);
    return {
      message: 'Login successful',
      user: userWithoutPassword!,
    };
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

    // 使用模型的方法验证密码
    const isValid = await user.verifyPassword(
      changePasswordDto.currentPassword,
    );
    if (!isValid) {
      throw new BadRequestException('Current password is incorrect');
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
