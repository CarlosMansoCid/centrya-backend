import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSecurityService } from './user-security.service';
import { UserSecurityController } from './user-security.controller';
import { UserSecurity } from './entities/user-security.entity';
import { Role } from '../roles/entities/role.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { RolesModule } from '../roles/roles.module';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserSecurity, Role, Permission]),
    RolesModule, // To access RoleService/Repository if needed for validation/fetching
    PermissionsModule, // To access PermissionService/Repository
  ],
  controllers: [UserSecurityController],
  providers: [UserSecurityService],
})
export class UserSecurityModule {}
