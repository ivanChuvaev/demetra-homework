import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  ForbiddenException,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import {
  DemetraBadRequestException,
  DemetraException,
  DemetraForbiddenException,
  DemetraNotFoundException,
} from './demetra.exception.js';

@Catch(DemetraException)
export class DemetraExceptionFilter implements ExceptionFilter {
  constructor(private readonly adapterHost: HttpAdapterHost) {}

  catch(exception: DemetraException, host: ArgumentsHost) {
    const httpException = this.toHttpException(exception);
    this.adapterHost.httpAdapter.reply(
      host.switchToHttp().getResponse(),
      httpException.getResponse(),
      httpException.getStatus(),
    );
  }

  private toHttpException(e: DemetraException): HttpException {
    if (e instanceof DemetraNotFoundException)
      return new NotFoundException(e.message);
    if (e instanceof DemetraBadRequestException)
      return new BadRequestException(e.message);
    if (e instanceof DemetraForbiddenException)
      return new ForbiddenException(e.message);
    return new InternalServerErrorException();
  }
}
