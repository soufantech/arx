import {
  PolicyFn,
  PolicyResult,
  AbstractPolicy,
  PolicyFnReturn,
} from './abstract-policy';
import { NotAllowedError } from '../errors';

export interface PolicyCanSettings {
  preformatError?: (message?: string) => Error;
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
    { preformatError }: PolicyCanSettings = {},
  ) {
    super();

    if (typeof fn !== 'function') {
      throw new Error('PolicyCan demands a function as argument');
    }

    if (typeof preformatError === 'function') {
      this.preformatError = preformatError;
    }
  }

  private preformatError(message?: string): Error {
    return new NotAllowedError(message ?? 'Not allowed');
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

    const error = this.normalize(result);

    return {
      error,
      allowed: !error,
    };
  }
}
