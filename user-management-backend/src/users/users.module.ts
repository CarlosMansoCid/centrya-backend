import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { UserSecurity } from '../user-security/entities/user-security.entity';
import { UserContact } from '../user-contact/entities/user-contact.entity';
import { UserSecurityModule } from '../user-security/user-security.module';
import { UserContactModule } from '../user-contact/user-contact.module';
// Import Roles and Permissions entities for direct repository injection in UsersService if needed,
// or rely on UserSecurityService to handle this.
// For this implementation, UsersService will create UserSecurity directly.
import { Role } from '../roles/entities/role.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { RolesModule } from '../roles/roles.module';
import { PermissionsModule } from '../permissions/permissions.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserSecurity, UserContact, Role, Permission]),
    UserSecurityModule, // Provides UserSecurityService, if we decide to use it
    UserContactModule,  // Provides UserContactService, if we decide to use it
    RolesModule,        // Provides RoleService/Repository for validation
    PermissionsModule,  // Provides PermissionService/Repository for validation
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
