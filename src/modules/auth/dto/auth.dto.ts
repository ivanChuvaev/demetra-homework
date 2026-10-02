import { createZodDto } from 'nestjs-zod';
import {
  refreshSchema,
  signInSchema,
  signUpSchema,
  tokenResponseSchema,
} from '../schemas/auth.schemas.js';

export class SignUpDto extends createZodDto(signUpSchema) {}
export class SignInDto extends createZodDto(signInSchema) {}
export class RefreshDto extends createZodDto(refreshSchema) {}
export class TokenResponseDto extends createZodDto(tokenResponseSchema) {}
