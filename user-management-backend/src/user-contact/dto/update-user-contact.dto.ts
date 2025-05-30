import { PartialType } from '@nestjs/mapped-types';
import { CreateUserContactDto } from './create-user-contact.dto';

export class UpdateUserContactDto extends PartialType(CreateUserContactDto) {}
