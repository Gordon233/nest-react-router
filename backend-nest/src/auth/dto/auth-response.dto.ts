import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dto/user-response.dto';

export class LoginResponseDto {
  @ApiProperty({
    type: UserResponseDto,
    description: 'User information',
  })
  user: UserResponseDto;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIs...',
    description: 'JWT access token',
  })
  access_token: string;

  @ApiPropertyOptional({
    example: 'Login successful',
    description: 'Response message',
  })
  message?: string;
}

export class RegisterResponseDto extends LoginResponseDto {}
