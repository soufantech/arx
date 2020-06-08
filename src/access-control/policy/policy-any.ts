import { PolicyFn, PolicyResult, AbstractPolicy } from './abstract-policy';

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
