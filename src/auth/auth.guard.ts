import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PUBLIC_DECORATOR_KEY } from './decorators/public.decorator.js';
import { AuthJwtPayload } from './auth.types.js';
import { UsersService } from '../users/users.service.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_DECORATOR_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    const request = context.switchToHttp().getRequest() as Request;
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('Token is not provided');
    }
    try {
      await this.jwtService.verifyAsync(token);
    } catch (error) {
      throw new UnauthorizedException('Token did not pass verification', {
        cause: error,
      });
    }
    const payload = this.jwtService.decode<AuthJwtPayload>(token);
    const user = await this.usersService.getUserById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Authorized user not found');
    }
    Object.assign(request, { user });
    return true;
  }

  private extractTokenFromHeader(request: Request) {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
