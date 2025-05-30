import { Controller, Post, Body, Get, Query, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RequestEmailChangeDto } from './dto/request-email-change.dto';
// Assuming JwtAuthGuard will be created later, e.g., in ./guards/jwt-auth.guard.ts
// For now, the import might cause an error if the file doesn't exist, but we'll add it.
// If running in an environment that checks for file existence before execution, this could be an issue.
// Let's stub it with a dummy class if needed for now, or just prepare for its future existence.
import { JwtAuthGuard } from './guards/jwt-auth.guard'; // Placeholder for now

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() signupDto: SignupDto) { // SignupDto is CreateUserDto
    return this.authService.signup(signupDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Query('token') token: string) {
    // Basic validation for token presence, more can be added in a DTO if preferred
    if (!token) {
        // Consider throwing BadRequestException here or handle in service
    }
    return this.authService.verifyEmail({ token });
  }

  @UseGuards(JwtAuthGuard) // Apply guard
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(@Request() req: any, @Body() changePasswordDto: ChangePasswordDto) {
    // req.user should be populated by JwtAuthGuard with { userId: number, email: string }
    const userId = req.user.userId; 
    return this.authService.changePassword(userId, changePasswordDto);
  }

  @UseGuards(JwtAuthGuard) // Apply guard
  @Post('request-email-change')
  @HttpCode(HttpStatus.OK)
  async requestEmailChange(@Request() req: any, @Body() requestEmailChangeDto: RequestEmailChangeDto) {
    const userId = req.user.userId;
    return this.authService.requestEmailChange(userId, requestEmailChangeDto);
  }

  @Get('confirm-email-change')
  @HttpCode(HttpStatus.OK)
  async confirmEmailChange(@Query('token') token: string) {
    if (!token) {
        // Consider throwing BadRequestException here
    }
    return this.authService.confirmEmailChange({ token });
  }
}
