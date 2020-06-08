import {
  PolicyFn,
  PolicyFnReturn,
  AbstractPolicy,
  PolicyCan,
  PolicyCanSettings,
  PolicyAny,
  PolicyAll,
} from './policy';

export { PolicyFn, PolicyResult } from './policy';

export type CanSettings = PolicyCanSettings;

export type Policy<T extends PolicyFn> = AbstractPolicy<T>;

export type Factor<T extends PolicyFn> = Policy<T> | PolicyFnReturn | T;

export type AccessControlSettings = {
  preformatError?: (message?: string) => Error;
  formatError?: (err: Error) => Error;
};

export class AccessControl {
  private readonly fnSettings: PolicyCanSettings;

  public constructor({
    preformatError,
    formatError,
  }: AccessControlSettings = {}) {
    this.fnSettings = {
      preformatError: preformatError,
      formatError: formatError,
    };
  }

  private normalizeFactors<T extends PolicyFn>(
    factors: Factor<T>[],
  ): Policy<T>[] {
    return factors.map((f) => {
      if (f instanceof AbstractPolicy) {
        return f;
      }

      if (typeof f === 'function') {
        return this.can(f);
      }

      return this.can(() => f);
    });
  }

  public can<T extends PolicyFn>(
    policyFn: T,
    settings: CanSettings = {},
  ): Policy<T> {
    const fnSettings: PolicyCanSettings = { ...this.fnSettings, ...settings };

    return new PolicyCan(policyFn, fnSettings);
  }

  public any<T extends PolicyFn>(...factors: Factor<T>[]): Policy<T> {
    const normalizedFactors = this.normalizeFactors(factors);

    return new PolicyAny<T>(normalizedFactors);
  }

  public all<T extends PolicyFn>(...factors: Factor<T>[]): Policy<T> {
    const normalizedFactors = this.normalizeFactors(factors);

    return new PolicyAll(normalizedFactors);
  }

  public allow<T extends PolicyFn>(): Policy<T> {
    return new PolicyCan(() => true);
  }

  public deny<T extends PolicyFn>(error?: string | Error): Policy<T> {
    const result = error ?? false;

    return new PolicyCan(() => result);
  }
}
