import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CreateUserSecurityDto } from './dto/create-user-security.dto';
import { UpdateUserSecurityDto } from './dto/update-user-security.dto';
import { UserSecurity } from './entities/user-security.entity';
import { Role } from '../roles/entities/role.entity';
import { Permission } from '../permissions/entities/permission.entity';

@Injectable()
export class UserSecurityService {
  constructor(
    @InjectRepository(UserSecurity)
    private readonly userSecurityRepository: Repository<UserSecurity>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async create(createUserSecurityDto: CreateUserSecurityDto): Promise<UserSecurity> {
    const { roleIds, permissionIds, ...restDto } = createUserSecurityDto;

    const userSecurity = this.userSecurityRepository.create(restDto);

    if (roleIds && roleIds.length > 0) {
      const roles = await this.roleRepository.findBy({ id: In(roleIds) });
      if (roles.length !== roleIds.length) {
        throw new BadRequestException('One or more roles not found.');
      }
      userSecurity.roles = roles;
    }

    if (permissionIds && permissionIds.length > 0) {
      const permissions = await this.permissionRepository.findBy({ id: In(permissionIds) });
      if (permissions.length !== permissionIds.length) {
        throw new BadRequestException('One or more permissions not found.');
      }
      userSecurity.permissions = permissions;
    }

    return this.userSecurityRepository.save(userSecurity);
  }

  async findAll(): Promise<UserSecurity[]> {
    return this.userSecurityRepository.find({ relations: ['roles', 'permissions'] });
  }

  async findOne(id: number): Promise<UserSecurity> {
    const userSecurity = await this.userSecurityRepository.findOne({
      where: { id },
      relations: ['roles', 'permissions'],
    });
    if (!userSecurity) {
      throw new NotFoundException(`UserSecurity with ID #${id} not found`);
    }
    return userSecurity;
  }

  async update(id: number, updateUserSecurityDto: UpdateUserSecurityDto): Promise<UserSecurity> {
    const { roleIds, permissionIds, ...restDto } = updateUserSecurityDto;
    
    const userSecurity = await this.userSecurityRepository.preload({
        id: id,
        ...restDto, // Spread passwordHash and active if they exist
    });

    if (!userSecurity) {
      throw new NotFoundException(`UserSecurity with ID #${id} not found`);
    }

    if (roleIds) {
      if (roleIds.length > 0) {
        const roles = await this.roleRepository.findBy({ id: In(roleIds) });
        if (roles.length !== roleIds.length) {
          throw new BadRequestException('One or more roles not found for update.');
        }
        userSecurity.roles = roles;
      } else { // Empty array means remove all roles
        userSecurity.roles = [];
      }
    }

    if (permissionIds) {
      if (permissionIds.length > 0) {
        const permissions = await this.permissionRepository.findBy({ id: In(permissionIds) });
        if (permissions.length !== permissionIds.length) {
          throw new BadRequestException('One or more permissions not found for update.');
        }
        userSecurity.permissions = permissions;
      } else { // Empty array means remove all permissions
        userSecurity.permissions = [];
      }
    }
    
    // Only update passwordHash if it's explicitly provided and not undefined
    if (updateUserSecurityDto.passwordHash === undefined) {
        delete userSecurity.passwordHash;
    }
    // Only update active if it's explicitly provided and not undefined
     if (updateUserSecurityDto.active === undefined) {
        delete userSecurity.active;
    }


    return this.userSecurityRepository.save(userSecurity);
  }

  async remove(id: number): Promise<void> {
    const result = await this.userSecurityRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`UserSecurity with ID #${id} not found`);
    }
  }

  // Example helper methods (can be expanded)
  async addRoleToUserSecurity(userSecurityId: number, roleId: number): Promise<UserSecurity> {
    const userSecurity = await this.findOne(userSecurityId);
    const role = await this.roleRepository.findOne({where: {id: roleId}});
    if (!role) {
      throw new NotFoundException(`Role with ID #${roleId} not found`);
    }
    userSecurity.roles = [...(userSecurity.roles || []), role];
    return this.userSecurityRepository.save(userSecurity);
  }

  async removeRoleFromUserSecurity(userSecurityId: number, roleId: number): Promise<UserSecurity> {
    const userSecurity = await this.findOne(userSecurityId);
    userSecurity.roles = (userSecurity.roles || []).filter(role => role.id !== roleId);
    return this.userSecurityRepository.save(userSecurity);
  }
   // Similar helpers for permissions can be added here
}
