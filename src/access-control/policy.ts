import { UnauthorizedError } from './errors';

export interface PolicyResult {
  allowed: boolean;
  error: Error | null;
}

export type PolicyFnReturn = string | boolean | Error | PolicyResult;

export interface PolicyFn {
  (...args: never[]): PolicyFnReturn | Promise<PolicyFnReturn>;
}

function isPolicyResult(result: unknown): result is PolicyResult {
  const error = (result as PolicyResult).error;

  return (
    (error instanceof Error || error === null) &&
    typeof (result as PolicyResult).allowed === 'boolean'
  );
}

export abstract class AbstractPolicy<T extends PolicyFn> {
  public abstract async inspect<S extends Parameters<T>>(
    ...args: S
  ): Promise<PolicyResult>;

  public async authorize<S extends Parameters<T>>(
    ...args: S
  ): Promise<boolean> {
    const result = await this.inspect(...args);

    if (!result.allowed) {
      throw result.error;
    }

    return true;
  }

  public async check<S extends Parameters<T>>(...args: S): Promise<boolean> {
    const result = await this.inspect(...args);

    return result.allowed;
  }
}

export interface PolicyCanSettings {
  preformatError?: (message?: string) => Error;
  formatError?: (err: Error) => Error;
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

export class PolicyAll<T extends PolicyFn> extends AbstractPolicy<T> {
  private readonly factors: AbstractPolicy<T>[];

  constructor(factors: AbstractPolicy<T>[]) {
    super();

    if (factors.length < 1) {
      throw Error('PolicyAll demands at least one factor');
    }

    this.factors = factors;
  }

  public async inspect<S extends Parameters<T>>(
    ...args: S
  ): Promise<PolicyResult> {
    let result: PolicyResult = null as never;

    for (const factor of this.factors) {
      result = await factor.inspect(...args);

      if (!result.allowed) {
        return result;
      }
    }

    return result;
  }
}

export class PolicyAny<T extends PolicyFn> extends AbstractPolicy<T> {
  private readonly factors: AbstractPolicy<T>[];

  constructor(factors: AbstractPolicy<T>[]) {
    super();

    if (factors.length < 1) {
      throw Error('PolicyAny demands at least one factor');
    }

    this.factors = factors;
  }

  public async inspect<S extends Parameters<T>>(
    ...args: S
  ): Promise<PolicyResult> {
    let result: PolicyResult = null as never;

    for (const factor of this.factors) {
      result = await factor.inspect(...args);

      if (result.allowed) {
        return result;
      }
    }

    return result;
  }
}
