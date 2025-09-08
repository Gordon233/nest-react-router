import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({
    example: 1,
    description: 'User ID',
  })
  id: number;

  @ApiProperty({
    example: 'John',
    description: 'User first name',
  })
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'User last name',
  })
  lastName: string;

  @ApiProperty({
    example: 'john@example.com',
    description: 'User email address',
  })
  email: string;

  @ApiProperty({
    example: true,
    description: 'User account status',
  })
  isActive: boolean;

  @ApiProperty({
    example: 'local',
    description: 'Authentication provider',
    enum: ['local', 'google', 'both'],
  })
  provider: 'local' | 'google' | 'both';

  @ApiPropertyOptional({
    example: '+1234567890',
    description: 'User phone number',
  })
  phone?: string;

  @ApiPropertyOptional({
    example: 'male',
    description: 'User gender',
    enum: ['male', 'female', 'other'],
  })
  gender?: 'male' | 'female' | 'other';

  @ApiProperty({
    example: '2024-01-01T00:00:00Z',
    description: 'Account creation date',
    type: Date,
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-01T00:00:00Z',
    description: 'Last update date',
    type: Date,
  })
  updatedAt: Date;
}
