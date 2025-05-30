import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
// We are not using PartialType from CreateUserDto directly to avoid complex nested partials for now.
// If more granular updates for security/contact are needed, specific DTOs are better.

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  lastName?: string;

  // Add fields for updating UserSecurity or UserContact if necessary,
  // or handle via separate service methods/endpoints.
  // For example:
  // @IsOptional()
  // @ValidateNested()
  // @Type(() => UpdateUserSecurityInputDto) // A specific DTO for security updates
  // security?: UpdateUserSecurityInputDto;

  // @IsOptional()
  // @ValidateNested()
  // @Type(() => UpdateUserContactInputDto) // A specific DTO for contact updates
  // contact?: UpdateUserContactInputDto;
}
