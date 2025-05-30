import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    const jwtSecret = configService.get<string>('JWT_SECRET');

    if (!jwtSecret) {
      // This error will stop the application from starting if JWT_SECRET is not set,
      // which is a good practice for critical configuration like this.
      throw new Error('JWT_SECRET is not defined in the environment variables. Application cannot start.');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret, // Use the validated jwtSecret
    });
  }

  async validate(payload: any) {
    // Assuming the JWT payload will have 'sub' for userId and 'email'
    return { userId: payload.sub, email: payload.email };
  }
}
