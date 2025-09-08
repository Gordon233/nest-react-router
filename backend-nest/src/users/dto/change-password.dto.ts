import { IsString, MinLength, Matches, IsOptional } from 'class-validator';

export class ChangePasswordDto {
  @IsOptional()
  @IsString()
  currentPassword?: string;

  @IsString()
  @MinLength(8)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'Password must contain uppercase, lowercase, number/special character',
  })
  newPassword: string;
}
