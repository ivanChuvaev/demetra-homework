import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Role } from '../roles/role.enum.js';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  username: string;

  @Column({ length: 100 })
  firstName: string;

  @Column({ length: 100 })
  lastName: string;

  @Column({ length: 64 })
  password: string;

  @Column()
  age: number;

  @Column({ length: 1000 })
  description: string;

  @Column({
    type: 'enum',
    enum: Role,
    array: true,
    default: [Role.CLIENT],
  })
  roles: Role[];

  @DeleteDateColumn()
  deletedAt?: Date;
}
