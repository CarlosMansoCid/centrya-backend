import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsArray,
  IsNumber,
  IsPositive,
  MinLength,
  ArrayMinSize,
} from 'class-validator';

export class CreateUserSecurityInputDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @IsPositive({ each: true })
  @ArrayMinSize(1)
  roleIds?: number[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @IsPositive({ each: true })
  @ArrayMinSize(1)
  permissionIds?: number[];
}
