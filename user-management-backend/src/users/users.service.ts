import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UserSecurity } from '../user-security/entities/user-security.entity';
import { UserContact } from '../user-contact/entities/user-contact.entity';
import { Role } from '../roles/entities/role.entity';
import { Permission } from '../permissions/entities/permission.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserSecurity)
    private readonly userSecurityRepository: Repository<UserSecurity>,
    @InjectRepository(UserContact)
    private readonly userContactRepository: Repository<UserContact>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    private readonly dataSource: DataSource, // For transactions
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { name, lastName, security: securityInput, contact: contactInput } = createUserDto;

      // 1. Create UserSecurity
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(securityInput.password, saltRounds);
      
      const newUserSecurity = new UserSecurity();
      newUserSecurity.passwordHash = hashedPassword;
      newUserSecurity.active = securityInput.active !== undefined ? securityInput.active : true;

      if (securityInput.roleIds && securityInput.roleIds.length > 0) {
        const roles = await this.roleRepository.findBy({ id: In(securityInput.roleIds) });
        if (roles.length !== securityInput.roleIds.length) {
          throw new BadRequestException('One or more roles not found.');
        }
        newUserSecurity.roles = roles;
      }

      if (securityInput.permissionIds && securityInput.permissionIds.length > 0) {
        const permissions = await this.permissionRepository.findBy({ id: In(securityInput.permissionIds) });
        if (permissions.length !== securityInput.permissionIds.length) {
          throw new BadRequestException('One or more permissions not found.');
        }
        newUserSecurity.permissions = permissions;
      }
      // UserSecurity is not saved yet, will be cascaded by User save

      // 2. Create UserContact (if provided)
      let newUserContact: UserContact | null = null;
      if (contactInput) {
        if (!contactInput.email && !contactInput.phone) {
          throw new BadRequestException('Either email or phone must be provided for contact.');
        }
        newUserContact = new UserContact();
        newUserContact.email = contactInput.email || null;
        newUserContact.phone = contactInput.phone || null;
        // UserContact is not saved yet, will be cascaded by User save
      }

      // 3. Create User
      const newUser = new User();
      newUser.name = name;
      newUser.lastName = lastName;
      newUser.security = newUserSecurity; // Assign the unsaved UserSecurity entity
      if (newUserContact) {
        newUser.contact = newUserContact; // Assign the unsaved UserContact entity
      }
      
      // Save the User entity, TypeORM will handle cascades for UserSecurity and UserContact
      // Note: For cascade to work on UserSecurity and UserContact when saving User,
      // they must be directly assigned to newUser.security and newUser.contact
      // and NOT saved separately beforehand if we rely on User's cascade.
      // Alternatively, save them explicitly with queryRunner.manager.save() before assigning.
      // To ensure UserSecurity and UserContact get their IDs before User is saved if needed elsewhere
      // it might be better to save them with queryRunner.manager.save()
      
      await queryRunner.manager.save(newUserSecurity);
      if (newUserContact) {
        await queryRunner.manager.save(newUserContact);
      }
      // now assign them again as they have IDs
      newUser.security = newUserSecurity;
      if (newUserContact) newUser.contact = newUserContact;


      const savedUser = await queryRunner.manager.save(User, newUser);

      await queryRunner.commitTransaction();
      // Return a representation of the user, potentially fetching it again to get all relations correctly populated by TypeORM
      return this.findOne(savedUser.id); 
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Error creating user: ' + error.message);
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({ relations: ['security', 'contact', 'security.roles', 'security.permissions'] });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['security', 'contact', 'security.roles', 'security.permissions'],
    });
    if (!user) {
      throw new NotFoundException(`User with ID #${id} not found`);
    }
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.preload({
      id: id,
      ...updateUserDto, // Only name and lastName as per DTO definition
    });

    if (!user) {
      throw new NotFoundException(`User with ID #${id} not found`);
    }
    // For related entities (security, contact), specific service methods should be used.
    // e.g., updateUserSecurity(userId, securityDto), updateUserContact(userId, contactDto)
    return this.userRepository.save(user);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id); // Ensures user exists and cascades will work
    // onDelete: 'CASCADE' for security and onDelete: 'SET NULL' for contact are defined in User entity.
    // TypeORM should handle this when user is removed.
    const result = await this.userRepository.delete(id);
    if (result.affected === 0) { // Should not happen if findOne worked
        throw new NotFoundException(`User with ID #${id} not found for deletion`);
    }
  }

  // --- New methods below ---

  async findByEmail(email: string): Promise<User | null> {
    if (!email) return null; // Or throw BadRequestException
    const user = await this.userRepository.findOne({
      where: { contact: { email } },
      relations: ['security', 'contact', 'security.roles', 'security.permissions'],
    });
    return user; // Can be null if not found, handled by caller
  }

  async setEmailVerified(email: string): Promise<UserContact> {
    if (!email) {
      throw new BadRequestException('Email must be provided.');
    }
    const contact = await this.userContactRepository.findOneBy({ email });
    if (!contact) {
      throw new NotFoundException(`UserContact with email ${email} not found.`);
    }
    contact.isEmailVerified = true;
    contact.emailVerificationToken = null;
    return this.userContactRepository.save(contact);
  }

  async storeEmailChangeToken(userId: number, newEmail: string, token: string): Promise<UserContact> {
    const user = await this.userRepository.findOne({ where: { id: userId }, relations: ['contact'] });
    if (!user || !user.contact) {
      throw new NotFoundException(`User or user contact not found for UserID #${userId}.`);
    }
    const contact = user.contact;
    contact.newEmail = newEmail;
    contact.emailChangeToken = token;
    return this.userContactRepository.save(contact);
  }

  async clearEmailChangeRequest(contactId: number): Promise<UserContact> {
    const contact = await this.userContactRepository.findOneBy({ id: contactId });
    if (!contact) {
      throw new NotFoundException(`UserContact with ID #${contactId} not found.`);
    }
    contact.newEmail = null;
    contact.emailChangeToken = null;
    return this.userContactRepository.save(contact);
  }

  async updateUserEmail(contactId: number, newEmail: string): Promise<UserContact> {
    const contact = await this.userContactRepository.findOneBy({ id: contactId });
    if (!contact) {
      throw new NotFoundException(`UserContact with ID #${contactId} not found.`);
    }
    contact.email = newEmail;
    contact.isEmailVerified = true; // Assuming token verification implies new email is verified
    contact.newEmail = null;
    contact.emailChangeToken = null;
    return this.userContactRepository.save(contact);
  }

  async updatePassword(userId: number, newPasswordHash: string): Promise<UserSecurity> {
    const user = await this.userRepository.findOne({ where: { id: userId }, relations: ['security'] });
    if (!user || !user.security) {
      throw new NotFoundException(`User or user security profile not found for UserID #${userId}.`);
    }
    const securityProfile = user.security;
    securityProfile.passwordHash = newPasswordHash;
    // Potentially add logic for passwordLastChangedAt, etc.
    return this.userSecurityRepository.save(securityProfile);
  }

  async storeEmailVerificationToken(userId: number, token: string): Promise<UserContact> {
    const user = await this.userRepository.findOne({ where: { id: userId }, relations: ['contact'] });
    if (!user || !user.contact) {
      throw new NotFoundException(`User or user contact not found for UserID #${userId}.`);
    }
    const contact = user.contact;
    contact.emailVerificationToken = token;
    contact.isEmailVerified = false; // Explicitly set to false until verified
    return this.userContactRepository.save(contact);
  }

  async findByEmailChangeToken(token: string): Promise<UserContact | null> {
    if (!token) return null;
    return this.userContactRepository.findOne({ where: { emailChangeToken: token } });
  }

  async findByEmailVerificationToken(token: string): Promise<UserContact | null> {
    if (!token) return null;
    return this.userContactRepository.findOne({ where: { emailVerificationToken: token } });
  }

  public async findByContactId(contactId: number): Promise<User | null> {
    return this.userRepository.findOne({
      where: { contact: { id: contactId } },
      // Add relations if needed, e.g., relations: ['security', 'contact']
      // depending on what the AuthService needs from this user object.
      // For the current use case in AuthService.confirmEmailChange, 'name' is used.
      // 'name' is a direct property of User, so no extra relations might be needed unless
      // getUserName method relies on other relations.
    });
  }
}
