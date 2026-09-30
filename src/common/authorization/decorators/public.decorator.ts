import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiSecurity } from '@nestjs/swagger';

export const PUBLIC_DECORATOR_KEY = 'PUBLIC_DECORATOR_KEY';
export const Public = () => {
  return applyDecorators(
    SetMetadata(PUBLIC_DECORATOR_KEY, true),
    ApiSecurity({}),
  );
};
