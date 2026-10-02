import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Token } from './entities/token.entity.js';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { UserResponseDto } from '../users/dto/user.dto.js';
import { User } from '../users/entities/user.entity.js';
import { userResponseSchema } from '../users/schemas/users.schemas.js';

@Injectable()
export class TokenService {
  constructor(
    @InjectRepository(Token)
    private readonly tokenRepository: Repository<Token>,
  ) {}

  async createUserToken(userId: number): Promise<string> {
    const tokenEntity = this.tokenRepository.create({
      user: { id: userId } as User,
      active: true,
      token: randomBytes(32).toString('base64url'),
    });
    await this.tokenRepository.save(tokenEntity);
    return tokenEntity.token;
  }

  async getTokenUser(token: string): Promise<UserResponseDto | null> {
    const tokenEntity = await this.tokenRepository.findOne({
      where: { token },
      relations: {
        user: true,
      },
    });
    if (!tokenEntity) {
      return null;
    }
    const user = tokenEntity.user;
    if (!tokenEntity.active) {
      await this.tokenRepository.update(
        { user: { id: user.id } },
        { active: false },
      ); // deactivate all other tokens of this user
      return null;
    }
    return userResponseSchema.parse(user);
  }
}
