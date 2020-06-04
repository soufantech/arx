import {
  PolicyFn,
  PolicyFnReturn,
  AbstractPolicy,
  PolicyCan,
  PolicyCanSettings,
  PolicyAny,
  PolicyAll,
} from './policy';

type Factor<T extends PolicyFn> = AbstractPolicy<T> | PolicyFnReturn | T;

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
  ): AbstractPolicy<T>[] {
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
    fn: T,
    settings: PolicyCanSettings = {},
  ): AbstractPolicy<T> {
    const fnSettings: PolicyCanSettings = { ...this.fnSettings, ...settings };

    return new PolicyCan(fn, fnSettings);
  }

  public any<T extends PolicyFn>(...factors: Factor<T>[]): AbstractPolicy<T> {
    const normalizedFactors = this.normalizeFactors(factors);

    return new PolicyAny<T>(normalizedFactors);
  }

  public all<T extends PolicyFn>(...factors: Factor<T>[]): AbstractPolicy<T> {
    const normalizedFactors = this.normalizeFactors(factors);

    return new PolicyAll(normalizedFactors);
  }
}
