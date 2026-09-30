import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { Public } from '../../common/authorization/decorators/public.decorator.js';
import { refreshSchema, signInSchema, signUpSchema } from './schemas/auth.schemas.js';
import { TokenPair, type RefreshDto } from './types/auth.types.js';
import { type SignUpDto } from './types/auth.types.js';
import { type SignInDto } from './types/auth.types.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('sign-in')
  async signIn(
    @Body({ schema: signInSchema })
    signInDto: SignInDto,
  ): Promise<TokenPair> {
    return this.authService.signIn(signInDto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('sign-up')
  // current implementation does not require email verification and anyone can create as many accounts as they want with any roles including Role.ADMIN
  async signUp(
    @Body({ schema: signUpSchema })
    signUpDto: SignUpDto,
  ): Promise<TokenPair> {
    return this.authService.signUp(signUpDto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(
    @Body({ schema: refreshSchema }) refreshDto: RefreshDto,
  ): Promise<TokenPair> {
    return this.authService.refreshTokens(refreshDto);
  }
}
