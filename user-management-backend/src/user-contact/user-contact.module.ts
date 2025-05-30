import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserContactService } from './user-contact.service';
import { UserContactController } from './user-contact.controller';
import { UserContact } from './entities/user-contact.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserContact])],
  controllers: [UserContactController],
  providers: [UserContactService],
})
export class UserContactModule {}
