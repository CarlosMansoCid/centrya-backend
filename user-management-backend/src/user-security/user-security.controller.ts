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
import { UserSecurityService } from './user-security.service';
import { CreateUserSecurityDto } from './dto/create-user-security.dto';
import { UpdateUserSecurityDto } from './dto/update-user-security.dto';
import { UserSecurity } from './entities/user-security.entity';

@Controller('user-security')
export class UserSecurityController {
  constructor(private readonly userSecurityService: UserSecurityService) {}

  @Post()
  create(@Body() createUserSecurityDto: CreateUserSecurityDto): Promise<UserSecurity> {
    return this.userSecurityService.create(createUserSecurityDto);
  }

  @Get()
  findAll(): Promise<UserSecurity[]> {
    return this.userSecurityService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<UserSecurity> {
    return this.userSecurityService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserSecurityDto: UpdateUserSecurityDto,
  ): Promise<UserSecurity> {
    return this.userSecurityService.update(id, updateUserSecurityDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.userSecurityService.remove(id);
  }

  // Example of how relationship management endpoints could be structured if added later
  // @Post(':id/roles/:roleId')
  // addRole(
  //   @Param('id', ParseIntPipe) id: number,
  //   @Param('roleId', ParseIntPipe) roleId: number,
  // ) {
  //   return this.userSecurityService.addRoleToUserSecurity(id, roleId);
  // }

  // @Delete(':id/roles/:roleId')
  // @HttpCode(HttpStatus.NO_CONTENT)
  // removeRole(
  //   @Param('id', ParseIntPipe) id: number,
  //   @Param('roleId', ParseIntPipe) roleId: number,
  // ) {
  //   return this.userSecurityService.removeRoleFromUserSecurity(id, roleId);
  // }
}
