import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  DeleteDateColumn,
  OneToMany,
  type Relation,
} from 'typeorm';
import { Role } from '../../../common/authorization/roles/role.enum.js';
import { Token } from '../../auth/entities/token.entity.js';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  username: string;

  @Column({ length: 256 })
  firstName: string;

  @Column({ length: 256 })
  lastName: string;

  @Column({ length: 64, select: false })
  password: string;

  @Column()
  age: number;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  description: string | null;

  @Column({
    type: 'enum',
    enum: Role,
    array: true,
    default: [Role.CLIENT],
  })
  roles: Role[];

  @DeleteDateColumn()
  deletedAt?: Date;

  @OneToMany(() => Token, (token) => token.user)
  tokens: Relation<Token>[];
}
