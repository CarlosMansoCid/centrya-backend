import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('user_contacts')
export class UserContact {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string | null;
}
