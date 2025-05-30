import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsArray,
  IsNumber,
  IsPositive,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUserSecurityDto {
  @IsString()
  @IsNotEmpty()
  passwordHash: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @IsPositive({ each: true })
  @ArrayMinSize(1, { each: false }) // Overall array should not be empty if provided
  roleIds?: number[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @IsPositive({ each: true })
  @ArrayMinSize(1, { each: false }) // Overall array should not be empty if provided
  permissionIds?: number[];
}
