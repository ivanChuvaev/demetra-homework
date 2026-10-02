import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module.js';
import { ConfigService } from '@nestjs/config';
import { DemetraEnvironment } from '../../common/types/demetra-environment.type.js';
import { TokenService } from './token.service.js';
import { Token } from './entities/token.entity.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity.js';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([User, Token]),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      async useFactory(configService: ConfigService<DemetraEnvironment>) {
        return {
          secret: configService.get('JWT_SECRET'),
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, TokenService],
  exports: [AuthService],
})
export class AuthModule {}
