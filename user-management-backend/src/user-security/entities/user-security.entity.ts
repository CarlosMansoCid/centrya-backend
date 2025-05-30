import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Role } from '../../roles/entities/role.entity';
import { Permission } from '../../permissions/entities/permission.entity';

@Entity('user_securities')
export class UserSecurity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  passwordHash?: string;

  @Column({ type: 'boolean', default: true, nullable: true })
  active?: boolean;

  @ManyToMany(() => Role, { eager: false })
  @JoinTable({
    name: 'user_security_roles', // name of the join table
    joinColumn: { name: 'user_security_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];

  @ManyToMany(() => Permission, { eager: false })
  @JoinTable({
    name: 'user_security_permissions', // name of the join table
    joinColumn: { name: 'user_security_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissions: Permission[];
}
