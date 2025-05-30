import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserContactService } from './user-contact.service';
import { CreateUserContactDto } from './dto/create-user-contact.dto';
import { UpdateUserContactDto } from './dto/update-user-contact.dto';
import { UserContact } from './entities/user-contact.entity';

@Controller('user-contact')
export class UserContactController {
  constructor(private readonly userContactService: UserContactService) {}

  @Post()
  create(@Body() createUserContactDto: CreateUserContactDto): Promise<UserContact> {
    return this.userContactService.create(createUserContactDto);
  }

  @Get()
  findAll(): Promise<UserContact[]> {
    return this.userContactService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<UserContact> {
    return this.userContactService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserContactDto: UpdateUserContactDto,
  ): Promise<UserContact> {
    return this.userContactService.update(id, updateUserContactDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.userContactService.remove(id);
  }
}
