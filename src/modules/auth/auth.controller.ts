import {
  Body,
  Controller,
  Cookies,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { Public } from '../../common/authorization/decorators/public.decorator.js';
import { SignInDto, SignUpDto, TokenResponseDto } from './dto/auth.dto.js';
import type { Response } from 'express';
import { tokenResponseSchema } from './schemas/auth.schemas.js';
import { TokenPair } from './types/auth.types.js';
import {
  DemetraInvalidValueException,
  DemetraNotFoundException,
} from '../../common/demetra/demetra.exception.js';

const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('sign-in')
  async signIn(
    @Body() signInDto: SignInDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<TokenResponseDto> {
    const tokenPair = await this.authService.signIn(signInDto);
    return this.respondWithTokens(res, tokenPair);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('sign-up')
  // current implementation does not require email verification and anyone can create as many accounts as they want with any roles including Role.ADMIN
  async signUp(
    @Body() signUpDto: SignUpDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<TokenResponseDto> {
    const tokenPair = await this.authService.signUp(signUpDto);
    return this.respondWithTokens(res, tokenPair);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(
    @Res({ passthrough: true }) response: Response,
    @Cookies('refreshToken') refreshToken: string,
  ): Promise<TokenResponseDto> {
    try {
      const tokenPair = await this.authService.refreshTokens({
        refreshToken,
      });
      return this.respondWithTokens(response, tokenPair);
    } catch (e) {
      if (
        e instanceof DemetraNotFoundException ||
        e instanceof DemetraInvalidValueException
      ) {
        throw new UnauthorizedException(e.message);
      }
      throw e;
    }
  }

  private respondWithTokens(
    res: Response,
    tokenPair: TokenPair,
  ): TokenResponseDto {
    res.cookie(REFRESH_TOKEN_COOKIE_NAME, tokenPair.refreshToken, {
      httpOnly: true,
      path: '/auth/refresh',
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return tokenResponseSchema.parse(tokenPair);
  }
}
