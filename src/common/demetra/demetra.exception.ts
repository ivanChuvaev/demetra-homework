export class DemetraException extends Error {}

export class DemetraBadRequestException extends DemetraException {}
export class DemetraNotFoundException extends DemetraException {}
export class DemetraForbiddenException extends DemetraException {}
export class DemetraUnauthorizedException extends DemetraException {}
export class DemetraInvalidValueException extends DemetraException {}
