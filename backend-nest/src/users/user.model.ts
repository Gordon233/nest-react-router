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
  password?: string;
  tokenVersion: number;
  googleId?: string;
  provider: 'local' | 'google' | 'both';
  createdAt: Date;
  updatedAt: Date;
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
    allowNull: true, // Google 用户可能没有
    unique: true,
  })
  declare googleId?: string;

  @Column({
    type: DataType.ENUM('local', 'google', 'both'),
    defaultValue: 'local',
  })
  declare provider: 'local' | 'google' | 'both';

  @Column({
    type: DataType.STRING,
    allowNull: true, // 改为可选！Google用户没密码
  })
  declare password?: string; // 注意改成可选

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

  @Column({
    type: DataType.INTEGER,
    defaultValue: 1,
    allowNull: false,
  })
  declare tokenVersion: number;

  // Hooks
  @BeforeCreate
  @BeforeUpdate
  static async hashPassword(instance: User) {
    // 先检查 password 是否存在且被修改了
    if (instance.password && instance.changed('password')) {
      const salt = await bcrypt.genSalt(10);
      instance.password = await bcrypt.hash(instance.password, salt);
    }
  }

  async verifyPassword(password: string): Promise<boolean> {
    // 如果当前实例没有password字段（因为默认scope排除了）
    if (!this.password) {
      // 用 withPassword scope 重新查询
      const userWithPassword = await User.scope('withPassword').findByPk(
        this.id,
      );

      // 如果数据库里确实没有密码（Google用户），返回false
      if (!userWithPassword?.password) {
        return false;
      }

      // 有密码，验证它
      return bcrypt.compare(password, userWithPassword.password);
    }

    // 当前实例有password字段，直接验证
    return bcrypt.compare(password, this.password);
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
    // Google 用户第一次设置密码时，provider 要改
    if (!this.password && this.provider === 'google') {
      this.provider = 'both';
    }

    this.password = newPassword;
    this.tokenVersion += 1;
    await this.save();
  }

  async invalidateAllTokens(): Promise<void> {
    this.tokenVersion += 1;
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
