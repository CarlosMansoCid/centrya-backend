import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserContactInputDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(7) // Basic phone number length validation
  phone?: string;
}
