import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service.js';
import { AuthJwtPayload } from './auth.types.js';
import type { RefreshDto, TokenPair } from './auth.types.js';
import type { SignUpDto } from './auth.types.js';
import type { SignInDto } from './auth.types.js';
import { User } from '../users/user.entity.js';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signIn(payload: SignInDto): Promise<TokenPair> {
    const user = await this.usersService.getUserByUsername(payload.username);
    if (!user) {
      throw new NotFoundException(
        `User with username: "${payload.username}" not found`,
      );
    }
    const isPasswordMatched = await this.usersService.comparePasswordWithHash(
      payload.password,
      user.password,
    );
    if (!isPasswordMatched) {
      throw new BadRequestException('Incorrect password');
    }

    return this.generateTokens({
      sub: user.id,
      username: user.username,
    });
  }

  async signUp(payload: SignUpDto): Promise<TokenPair> {
    const user = await this.usersService.createUser(payload);
    return this.generateTokens({
      sub: user.id,
      username: user.username,
    });
  }

  async refreshTokens(payload: RefreshDto): Promise<TokenPair> {
    const user = await this.extractUserFromToken(payload.refreshToken);
    if (!user) {
      throw new UnauthorizedException('Authorized user not found');
    }
    return this.generateTokens({
      sub: user.id,
      username: user.username,
    });
  }

  async generateTokens(payload: AuthJwtPayload): Promise<TokenPair> {
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '5m',
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: '6M',
    });
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async verifyToken(jwt: string): Promise<boolean> {
    try {
      await this.jwtService.verifyAsync(jwt);
      return true;
    } catch {
      return false;
    }
  }

  async extractUserFromToken(jwt: string): Promise<User | null> {
    if (!(await this.verifyToken(jwt))) {
      throw new UnauthorizedException('JWT token did not pass verification');
    }
    const tokenPayload = this.jwtService.decode(jwt) as AuthJwtPayload;
    return this.usersService.getUserById(tokenPayload.sub);
  }
}
