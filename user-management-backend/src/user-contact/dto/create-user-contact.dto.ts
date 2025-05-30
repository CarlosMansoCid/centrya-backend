import { IsEmail, IsOptional, IsString, IsPhoneNumber, MinLength, ValidateIf } from 'class-validator';

export class CreateUserContactDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  // @IsPhoneNumber(null) // Using a specific region might be too restrictive, using IsString for now.
  @MinLength(7) // Basic phone number length validation
  phone?: string;
}
