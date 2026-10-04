import {
  Entity,
  PrimaryColumn,
  ManyToOne,
  Column,
  type Relation,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';

@Entity()
export class Token {
  @PrimaryColumn()
  token: string;

  @Column()
  active: boolean;

  @ManyToOne(() => User, (user) => user.tokens)
  user: Relation<User>;
}
