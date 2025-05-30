import { PartialType } from '@nestjs/mapped-types';
import { CreatePermissionDto } from './create-permission.dto';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdatePermissionDto extends PartialType(CreatePermissionDto) {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;
}
