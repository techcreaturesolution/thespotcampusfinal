import { StatusCodes } from "http-status-codes";

export class NotFoundError extends Error {
  constructor(message, code = null) {
    super(message);
    this.name = "NotFoundError";
    this.statusCode = StatusCodes.NOT_FOUND;
    if (code) this.code = code;
  }
}

export class BadRequestError extends Error {
  constructor(message, code = null, details = null) {
    super(message);
    this.name = "BadRequestError";
    this.statusCode = StatusCodes.BAD_REQUEST;
    if (code) this.code = code;
    if (details) this.details = details;
  }
}

export class UnprocessableEntityError extends Error {
  constructor(message, code = "VALIDATION_FAILED", details = null) {
    super(message);
    this.name = "UnprocessableEntityError";
    this.statusCode = StatusCodes.UNPROCESSABLE_ENTITY;
    if (code) this.code = code;
    if (details) this.details = details;
  }
}

export class UnauthenticatedError extends Error {
  constructor(message) {
    super(message);
    this.name = "UnauthenticatedError";
    this.statusCode = StatusCodes.UNAUTHORIZED;
  }
}

export class UnauthorizedError extends Error {
  constructor(message, code = null) {
    super(message);
    this.name = "UnauthorizedError";
    this.statusCode = StatusCodes.FORBIDDEN;
    if (code) this.code = code;
  }
}
