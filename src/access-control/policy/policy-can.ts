import {
  PolicyFn,
  PolicyResult,
  AbstractPolicy,
  PolicyFnReturn,
} from './abstract-policy';
import { UnauthorizedError } from '../errors';

export interface PolicyCanSettings {
  preformatError?: (message?: string) => Error;
  formatError?: (err: Error) => Error;
}

function isPolicyResult(result: unknown): result is PolicyResult {
  const error = (result as PolicyResult).error;

  return (
    (error instanceof Error || error === null) &&
    typeof (result as PolicyResult).allowed === 'boolean'
  );
}

export class PolicyCan<T extends PolicyFn> extends AbstractPolicy<T> {
  constructor(
    private readonly fn: T,
    { preformatError, formatError }: PolicyCanSettings = {},
  ) {
    super();

    if (typeof fn !== 'function') {
      throw new Error('PolicyCan demands a function as argument');
    }

    if (typeof formatError === 'function') {
      this.formatError = formatError;
    }

    if (typeof preformatError === 'function') {
      this.preformatError = preformatError;
    }
  }

  private formatError(err: Error): Error {
    return err;
  }

  private preformatError(message?: string): Error {
    return new UnauthorizedError(message ?? 'Unauthorized');
  }

  private normalize(result: PolicyFnReturn): null | Error {
    if (result === true) {
      return null;
    }

    if (result instanceof Error) {
      return result;
    }

    if (isPolicyResult(result)) {
      return result.error;
    }

    const errorMessage = typeof result === 'string' ? result : undefined;

    return this.preformatError(errorMessage);
  }

  public async inspect<S extends Parameters<T>>(
    ...args: S
  ): Promise<PolicyResult> {
    const result = await this.fn(...args);

    const normalizedResult = this.normalize(result);

    const error =
      normalizedResult instanceof Error
        ? this.formatError(normalizedResult)
        : normalizedResult;

    return {
      error,
      allowed: !error,
    };
  }
}
