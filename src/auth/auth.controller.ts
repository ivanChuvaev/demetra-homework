import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { Public } from './decorators/public.decorator.js';
import { refreshSchema, signInSchema, signUpSchema } from './auth.schemas.js';
import z from 'zod';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('sign-in')
  async signIn(
    @Body({ schema: signInSchema })
    signInDto: z.infer<typeof signInSchema>,
  ) {
    return this.authService.signIn(signInDto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('sign-up')
  // current implementation does not require email verification and anyone can create as many accounts as they want with any roles including Role.ADMIN
  async signUp(
    @Body({ schema: signUpSchema })
    signUpDto: z.infer<typeof signUpSchema>,
  ) {
    return this.authService.signUp(signUpDto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(
    @Body({ schema: refreshSchema }) refreshDto: z.infer<typeof refreshSchema>,
  ) {
    return this.authService.refreshTokens(refreshDto);
  }
}
