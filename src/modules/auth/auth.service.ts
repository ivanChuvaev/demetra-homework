import {
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service.js';
import { AuthJwtPayload, TokenPair } from './types/auth.types.js';
import { RefreshDto, SignInDto, SignUpDto } from './dto/auth.dto.js';
import { UserResponseDto } from '../users/dto/user.dto.js';
import { TokenService } from './token.service.js';
import {
  DemetraBadRequestException,
  DemetraInvalidValueException,
  DemetraNotFoundException,
} from '../../common/demetra/demetra.exception.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly tokenService: TokenService,
  ) {}

  async signIn(payload: SignInDto): Promise<TokenPair> {
    const user = await this.usersService.getUserByUsername(payload.username);
    if (!user) {
      throw new DemetraNotFoundException(
        `User with username: "${payload.username}" not found`,
      );
    }
    const isPasswordMatched =
      await this.usersService.compareUserPasswordWithProvidedPassword(
        user.id,
        payload.password,
      );
    if (!isPasswordMatched) {
      throw new DemetraBadRequestException('Incorrect password');
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
    const user = await this.tokenService.getTokenUser(payload.refreshToken)
    if (!user) {
      throw new DemetraNotFoundException('Authorized user not found');
    }
    return this.generateTokens({
      sub: user.id,
      username: user.username,
    });
  }

  async generateTokens(payload: AuthJwtPayload): Promise<TokenPair> {
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '1 hour',
    });
    const refreshToken = await this.tokenService.createUserToken(payload.sub);
    return {
      accessToken,
      refreshToken,
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

  async extractUserFromToken(jwt: string): Promise<UserResponseDto | null> {
    if (!(await this.verifyToken(jwt))) {
      throw new DemetraInvalidValueException(
        'JWT token did not pass verification',
      );
    }
    const tokenPayload = this.jwtService.decode(jwt) as AuthJwtPayload;
    return this.usersService.getUserById(tokenPayload.sub);
  }
}
