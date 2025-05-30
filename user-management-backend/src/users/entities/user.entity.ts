import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { UserSecurity } from '../../user-security/entities/user-security.entity';
import { UserContact } from '../../user-contact/entities/user-contact.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  lastName: string;

  @OneToOne(() => UserSecurity, { cascade: true, onDelete: 'CASCADE' })
  @JoinColumn()
  security: UserSecurity;

  @OneToOne(() => UserContact, { cascade: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn()
  contact: UserContact | null;
}
