import { IsString, IsNotEmpty, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateUserSecurityInputDto } from './create-user-security-input.dto';
import { CreateUserContactInputDto } from './create-user-contact-input.dto';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ValidateNested()
  @Type(() => CreateUserSecurityInputDto)
  security: CreateUserSecurityInputDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateUserContactInputDto)
  contact?: CreateUserContactInputDto;
}
