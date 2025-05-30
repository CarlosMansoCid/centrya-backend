import { IsString, MinLength, Matches } from 'class-validator';

export class ChangePasswordDto {
  @IsString({ message: 'Current password must be a string.' })
  @MinLength(8, { message: 'Current password must be at least 8 characters long.' })
  currentPassword: string;

  @IsString({ message: 'New password must be a string.' })
  @MinLength(8, { message: 'New password must be at least 8 characters long.' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/, {
    message: 'New password must contain at least one lowercase letter, one uppercase letter, one digit, one special character, and be at least 8 characters long.',
  })
  newPassword: string;
}
