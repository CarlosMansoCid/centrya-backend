import { PartialType } from '@nestjs/mapped-types';
import { CreateUserSecurityDto } from './create-user-security.dto';

export class UpdateUserSecurityDto extends PartialType(CreateUserSecurityDto) {}
