import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';

@Module({
  imports: [ConfigModule], // Make ConfigService available
  providers: [EmailService],
  exports: [EmailService], // Export EmailService if other modules need to inject it directly
})
export class EmailModule {}
