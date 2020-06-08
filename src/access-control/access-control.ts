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

export type Policy<T extends PolicyFn> = AbstractPolicy<T>;

export type Factor<T extends PolicyFn> = Policy<T> | PolicyFnReturn | T;

export type AccessControlSettings = {
  preformatError?: (message?: string) => Error;
  formatError?: (err: Error) => Error;
};

export class AccessControl {
  private readonly fnSettings: PolicyCanSettings;
  private readonly allowedPolicy: Policy<PolicyFn>;
  private readonly deniedPolicy: Policy<PolicyFn>;

  public constructor({
    preformatError,
    formatError,
  }: AccessControlSettings = {}) {
    this.fnSettings = {
      preformatError: preformatError,
      formatError: formatError,
    };

    // Cached policy object for AbstractControl.deny
    this.deniedPolicy = this.can(() => false);

    // Cached policy object for AbstractControl.allow
    this.allowedPolicy = this.can(() => true);
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

  /**
   * Allows or denies according to the policy function return.
   */
  public can<T extends PolicyFn>(policyFn: T): Policy<T> {
    return new PolicyCan(policyFn, this.fnSettings);
  }

  /**
   * Allows if at least one of the factors allow. Denies otherwise.
   */
  public any<T extends PolicyFn>(...factors: Factor<T>[]): Policy<T> {
    const normalizedFactors = this.normalizeFactors(factors);

    return new PolicyAny(normalizedFactors);
  }

  /**
   * Denies if at least one of the factors deny. Allows otherwise.
   */
  public all<T extends PolicyFn>(...factors: Factor<T>[]): Policy<T> {
    const normalizedFactors = this.normalizeFactors(factors);

    return new PolicyAll(normalizedFactors);
  }

  /**
   * Always allows.
   */
  public allow<T extends PolicyFn = PolicyFn>(): Policy<T> {
    return this.allowedPolicy;
  }

  /**
   * Always denies.
   */
  public deny<T extends PolicyFn = PolicyFn>(): Policy<T> {
    return this.deniedPolicy;
  }
}
