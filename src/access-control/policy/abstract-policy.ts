import { SyncAsync } from '../../utils';

export interface PolicyResult {
  allowed: boolean;
  error: Error | null;
}

export type PolicyFnReturn = string | boolean | Error | PolicyResult;

export interface PolicyFn {
  (...args: never[]): SyncAsync<PolicyFnReturn>;
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
