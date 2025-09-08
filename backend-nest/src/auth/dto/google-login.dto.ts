import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class GoogleLoginDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  idToken: string;
}
