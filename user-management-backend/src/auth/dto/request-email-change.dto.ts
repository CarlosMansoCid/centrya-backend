import { IsEmail } from 'class-validator';

export class RequestEmailChangeDto {
  @IsEmail({}, { message: 'Please enter a valid new email address.' })
  newEmail: string;
}
