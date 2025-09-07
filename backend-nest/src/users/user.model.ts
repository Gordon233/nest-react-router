// src/users/user.model.ts
import {
  Column,
  Model,
  Table,
  DataType,
  BeforeCreate,
  BeforeUpdate,
  DefaultScope,
  Scopes,
} from 'sequelize-typescript';
import * as bcrypt from 'bcrypt';

export interface UserJSON {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  phone?: string;
  gender?: 'male' | 'female' | 'other';
  createdAt: Date;
  updatedAt: Date;
  password?: string;
}

// 默认不返回密码
@DefaultScope(() => ({
  attributes: { exclude: ['password'] },
}))
@Scopes(() => ({
  withPassword: {
    attributes: { include: ['password'] },
  },
}))
@Table({
  tableName: 'users',
  timestamps: true,
})
export class User extends Model {
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare firstName: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare lastName: string;

  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  })
  declare email: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare password: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  declare isActive: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare phone?: string;

  @Column({
    type: DataType.ENUM('male', 'female', 'other'),
    allowNull: true,
  })
  declare gender?: 'male' | 'female' | 'other';

  // Hooks
  @BeforeCreate
  @BeforeUpdate
  static async hashPassword(instance: User) {
    if (instance.changed('password')) {
      const salt = await bcrypt.genSalt(10);
      instance.password = await bcrypt.hash(instance.password, salt);
    }
  }

  async verifyPassword(password: string): Promise<boolean> {
    // 修复：直接使用当前实例的密码（如果有）或重新查询
    if (this.password) {
      return bcrypt.compare(password, this.password);
    }

    // 如果当前实例没有密码字段，重新查询
    const userWithPassword = await User.scope('withPassword').findByPk(this.id);
    if (!userWithPassword) return false;
    return bcrypt.compare(password, userWithPassword.password);
  }

  async deactivate(): Promise<void> {
    this.isActive = false;
    await this.save();
  }

  async activate(): Promise<void> {
    this.isActive = true;
    await this.save();
  }

  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  async changePassword(newPassword: string): Promise<void> {
    this.password = newPassword;
    await this.save();
  }

  // 静态方法
  static async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ where: { email } });
  }

  static async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.scope('withPassword').findOne({ where: { email } });
  }

  static async findActive(): Promise<User[]> {
    return this.findAll({ where: { isActive: true } });
  }

  toJSON(): Omit<UserJSON, 'password'> {
    const values = super.toJSON<UserJSON>();
    delete values.password;
    return values;
  }
}
