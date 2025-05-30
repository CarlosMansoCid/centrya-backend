import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { EmailService } from '../email/email.service'; // Added
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity'; // Added
import { CreateUserDto } from '../users/dto/create-user.dto';
// import { LoginDto } from './dto/login.dto'; // Placeholder
// Define other DTOs inline for now
// interface ChangePasswordDto { currentPassword: string; newPassword: string; }
// interface RequestEmailChangeDto { newEmail: string; }
// interface ConfirmEmailChangeDto { token: string; }
// interface VerifyEmailDto { token: string; }


@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService, // Added
  ) {}

  private async getUserName(user: User | CreateUserDto): Promise<string> {
    // If it's a CreateUserDto, name might be directly available
    if ('name' in user && user.name) {
      return user.name;
    }
    // If it's a User entity, name is available
    if (user instanceof User && user.name) {
      return user.name;
    }
    // Fallback if name is not directly on the object passed (e.g. only userId is available)
    // This case might require fetching the user if not already available.
    // For simplicity, current AuthService methods that need name usually have `user` object.
    return 'User'; // Default fallback
  }

  async login(loginDto: { email: string; password: string }): Promise<{ accessToken: string }> {
    const { email, password } = loginDto;
    const user = await this.usersService.findByEmail(email);

    if (!user || !user.security || !user.contact) { // Ensure contact also exists
      throw new UnauthorizedException('Invalid credentials or user data incomplete.');
    }
    
    if (!user.contact.isEmailVerified) {
        throw new UnauthorizedException('Email not verified. Please verify your email first.');
    }

    const isPasswordMatching = await bcrypt.compare(password, user.security.passwordHash);

    if (!isPasswordMatching) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { email: user.contact.email, sub: user.id };
    const token = this.jwtService.sign(payload);

    return { accessToken: token };
  }

  async signup(createUserDto: CreateUserDto): Promise<{ message: string; userId?: number }> {
    const createdUser = await this.usersService.create(createUserDto);

    if (!createdUser || !createdUser.id || !createdUser.contact || !createdUser.contact.email) {
        throw new BadRequestException('User creation failed or user contact/email is missing.');
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    await this.usersService.storeEmailVerificationToken(createdUser.id, verificationToken);
    
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    if (!frontendUrl) {
        console.error("FRONTEND_URL not configured. Email links may be incorrect.");
        // Potentially throw error or log critical warning
    }

    try {
      const userName = await this.getUserName(createdUser); // createdUser includes name
      await this.emailService.sendVerificationEmail(
        createdUser.contact.email,
        userName,
        verificationToken,
        frontendUrl || '', // Fallback to empty string if not configured
      );
    } catch (emailError) {
      console.error(`Failed to send verification email to ${createdUser.contact.email}:`, emailError);
      // Decide if this error should be thrown or just logged.
      // For now, we log it and let the signup process complete.
    }

    return { message: 'Signup successful. Please verify your email.', userId: createdUser.id };
  }

  async verifyEmail(verifyEmailDto: { token: string }): Promise<{ message: string }> {
    const { token } = verifyEmailDto;
    const userContact = await this.usersService.findByEmailVerificationToken(token);

    if (!userContact || !userContact.email) {
      throw new BadRequestException('Invalid or expired verification token.');
    }

    await this.usersService.setEmailVerified(userContact.email);
    return { message: 'Email successfully verified.' };
  }
  
  async changePassword(userId: number, changePasswordDto: {currentPassword: string; newPassword: string}): Promise<{ message: string }> {
    const { currentPassword, newPassword } = changePasswordDto;
    const user = await this.usersService.findOne(userId); // findOne loads security relation by default

    if (!user || !user.security || !user.contact) { // Ensure contact exists for email notification
      throw new NotFoundException('User not found or critical user data missing.');
    }

    const isPasswordMatching = await bcrypt.compare(currentPassword, user.security.passwordHash);
    if (!isPasswordMatching) {
      throw new UnauthorizedException('Invalid current password.');
    }

    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
    await this.usersService.updatePassword(userId, hashedNewPassword);

    try {
      const userName = await this.getUserName(user);
      if (user.contact && user.contact.email) { // Added check here
        await this.emailService.sendPasswordChangeNotificationEmail(user.contact.email, userName);
      } else {
        console.error(`User contact email not found for user ID: ${userId}. Cannot send password change notification.`);
      }
    } catch (emailError) {
      // Updated logging to be more specific if email was attempted
      const emailForLog = user.contact && user.contact.email ? user.contact.email : `ID ${userId} (email not found)`;
      console.error(`Failed to send password change notification to ${emailForLog}:`, emailError);
      // Log and continue
    }
    return { message: 'Password successfully changed.' };
  }

  async requestEmailChange(userId: number, requestEmailChangeDto: { newEmail: string }): Promise<{ message: string }> {
    const { newEmail } = requestEmailChangeDto;
    // Ensure user and contact details exist
    const user = await this.usersService.findOne(userId);
    if (!user || !user.contact) {
        throw new NotFoundException('User or user contact details not found.');
    }
    
    // Optional: Check if newEmail is same as current one
    if (user.contact.email === newEmail) {
        throw new BadRequestException('New email cannot be the same as the current email.');
    }

    // Optional: Check if newEmail is already in use by another user
    const existingUserWithNewEmail = await this.usersService.findByEmail(newEmail);
    if (existingUserWithNewEmail && existingUserWithNewEmail.id !== userId) {
        throw new BadRequestException('This email address is already in use.');
    }

    const emailChangeToken = crypto.randomBytes(32).toString('hex');
    await this.usersService.storeEmailChangeToken(userId, newEmail, emailChangeToken);

    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    if (!frontendUrl) {
        console.error("FRONTEND_URL not configured. Email links may be incorrect.");
    }
    
    try {
      const userName = await this.getUserName(user);
      await this.emailService.sendEmailChangeVerificationEmail(
        newEmail, // Send to the new email address for verification
        userName,
        newEmail, // Pass newEmail again for the template placeholder
        emailChangeToken,
        frontendUrl || '',
      );
    } catch (emailError) {
      console.error(`Failed to send email change verification to ${newEmail}:`, emailError);
      // Log and continue
    }

    return { message: 'Email change request received. Please check your new email address to confirm.' };
  }

  async confirmEmailChange(confirmEmailChangeDto: { token: string }): Promise<{ message: string }> {
    const { token } = confirmEmailChangeDto;
    const userContact = await this.usersService.findByEmailChangeToken(token);

    if (!userContact || !userContact.newEmail) {
      throw new BadRequestException('Invalid or expired email change token.');
    }

    const oldEmail = userContact.email;
    const newEmail = userContact.newEmail;

    await this.usersService.updateUserEmail(userContact.id, newEmail);
    
    // Need to fetch the user to get their name for the notification email.
    // Assuming userContact.userId exists or can be inferred if UserContact has a relation to User.
    // For now, let's assume we might not have the user's name directly from userContact.
    // This part might need adjustment based on entity relations.
    // If UserContact has a 'user' relation: const userName = userContact.user.name;
    // Or find user by contact id if needed.
    // For now, using a generic name or fetching user if critical.
    
    let userNameForNotification = 'User'; 
    // Attempt to get user details if possible to provide a name.
    // This is a simplified approach; a more robust solution might involve ensuring user context.
    const userOwningContact = await this.usersService.findByContactId(userContact.id);
    if (userOwningContact) {
        userNameForNotification = await this.getUserName(userOwningContact);
    }

    try {
      if (oldEmail) { // Send notification to old email only if it existed
        await this.emailService.sendEmailChangeNotificationEmail(oldEmail, userNameForNotification, oldEmail, newEmail);
      }
      await this.emailService.sendEmailChangeNotificationEmail(newEmail, userNameForNotification, oldEmail || 'your previous email', newEmail); // Notify new email
    } catch (emailError) {
      console.error(`Failed to send email change notifications (old: ${oldEmail}, new: ${newEmail}):`, emailError);
      // Log and continue
    }

    return { message: 'Email successfully changed.' };
  }
}
