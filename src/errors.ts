export abstract class ArxError extends Error {
  constructor(message: string) {
    super(message);

    Error.captureStackTrace(this, this.constructor);
    Object.defineProperty(this, 'name', { value: this.constructor.name });
  }
}
