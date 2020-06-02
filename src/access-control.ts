/* eslint-disable @typescript-eslint/no-explicit-any */

export interface PolicyResult {
  allowed: boolean;
  path: string[];
  error: Error | null;
}

export type PredicateReturn = string | boolean | Error | PolicyResult;

export interface PolicyPredicate {
  (...args: any[]): PredicateReturn | Promise<PredicateReturn>;
}
// TODO: define `UnauthorizedError` properly
export class UnauthorizedError extends Error {}

const behaviorValues = ['or', 'and'] as const;

type PresetBehavior = typeof behaviorValues[number];

interface Preset {
  policy: string;
  behavior: PresetBehavior;
  args: any[];
}

interface Policy {
  name: string;
  presets: Preset[];
  predicate: PolicyPredicate;
}

export type PolicySettings = {
  name: Policy['name'];
  predicate: Policy['predicate'];
  presets?: PresetSettings[];
};

export type PresetSettings = {
  policy: Preset['policy'];
  behavior?: Preset['behavior'];
  args?: Preset['args'];
};

export interface ErrorTransformer {
  (message?: string): Error;
}

export type AccessControlSettings = {
  preformatError?: (message?: string) => Error;
  formatError?: (err: Error) => Error;
  presets?: PresetSettings[];
};

export type OpCode = 'and' | 'or';

export type Op = {
  opcode: OpCode;
  factors: Array<Policy['name'] | Op | PolicyResult>;
};

type AuthFactor = Policy['name'] | Op | PolicyResult;

function isPolicyResult(factor: unknown): factor is PolicyResult {
  const error = (factor as PolicyResult).error;

  return (
    (error instanceof Error || error === null) &&
    typeof (factor as PolicyResult).allowed === 'boolean' &&
    Array.isArray((factor as PolicyResult).path)
  );
}

export function and(...factors: AuthFactor[]): Op {
  if (factors.length < 2) {
    throw new Error('Operation `and` demands at least 2 arguments');
  }

  return {
    opcode: 'and',
    factors,
  };
}

export function or(...factors: AuthFactor[]): Op {
  if (factors.length < 2) {
    throw new Error('Operation `or` demands at least 2 arguments');
  }

  return {
    opcode: 'or',
    factors,
  };
}

function makePreset({ policy, behavior, args }: PresetSettings): Preset {
  if (typeof policy === 'undefined') {
    throw new Error(`Argument for preset parameter "policy" must be present`);
  }

  if (args && !Array.isArray(args)) {
    throw new Error(
      `Argument for for preset parameter "args" must be an array`,
    );
  }

  const normalizedPreset: Preset = {
    policy,
    behavior: 'and',
    args: args ?? [],
  };

  if (typeof behavior !== 'undefined') {
    if (!behaviorValues.includes(behavior)) {
      throw new Error(
        `Argument for preset parameter "behavior" must be one of the following values: ${behaviorValues.join(
          ', ',
        )}`,
      );
    }

    normalizedPreset.behavior = behavior;
  }

  return normalizedPreset;
}

function makePolicy({ name, predicate, presets }: PolicySettings): Policy {
  if (typeof name === 'undefined') {
    throw new Error(`Argument for policy parameter "name" must be present`);
  }

  if (typeof predicate !== 'function') {
    throw new Error(
      `Argument for policy parameter "predicate" must be a function`,
    );
  }

  if (typeof presets !== 'undefined' && !Array.isArray(presets)) {
    throw new Error(
      `Argument for policy parameter "presets", if present, must be an array of preset objects`,
    );
  }

  const normalizedPresets = (Array.isArray(presets) ? presets : []).map(
    makePreset,
  );

  return { name, predicate, presets: normalizedPresets };
}

export class AccessControl {
  private readonly policies = new Map<string, Policy>();
  private readonly presets: Preset[];

  constructor({
    preformatError,
    formatError,
    presets,
  }: AccessControlSettings = {}) {
    if (typeof formatError === 'function') {
      this.formatError = formatError;
    }

    if (typeof preformatError === 'function') {
      this.preformatError = preformatError;
    }

    this.presets = (presets ?? []).map(makePreset);
  }

  private formatError(err: Error): Error {
    return err;
  }

  private preformatError(message?: string): Error {
    return new UnauthorizedError(message ?? 'Unauthorized');
  }

  private normalizePredicateResult(
    predicateReturn: PredicateReturn,
  ): null | Error {
    if (predicateReturn === true) {
      return null;
    }

    if (predicateReturn instanceof Error) {
      return predicateReturn;
    }

    if (isPolicyResult(predicateReturn)) {
      return predicateReturn.error;
    }

    const errorMessage =
      typeof predicateReturn === 'string' ? predicateReturn : undefined;

    return this.preformatError(errorMessage);
  }

  private getPolicy(name: string): Policy {
    const policy = this.policies.get(name);

    if (!policy) {
      throw new Error(`No policy named "${name}" has been defined`);
    }

    return policy;
  }

  private async processPolicy(
    policy: string,
    args: any[],
  ): Promise<PolicyResult> {
    return this.processPolicyRecursively([policy], policy, args);
  }

  private async processPolicyRecursively(
    path: string[],
    policy: string,
    args: any[],
  ): Promise<PolicyResult> {
    const policyObj = this.getPolicy(policy);

    for (const preset of this.presets.concat(policyObj.presets)) {
      if (path.includes(preset.policy)) {
        throw new Error(
          `Circular reference error: policy ${
            preset.policy
          } is backreferenced in path: ${path.join(' > ')}`,
        );
      }

      const presetResult = await this.processPolicyRecursively(
        path.concat(preset.policy),
        preset.policy,
        args.concat(preset.args),
      );

      if (
        ('or' === preset.behavior && presetResult.allowed) ||
        ('and' === preset.behavior && !presetResult.allowed)
      ) {
        return presetResult;
      } else {
        continue;
      }
    }

    const result = await Promise.resolve(policyObj.predicate(...args)).then(
      this.normalizePredicateResult.bind(this),
    );

    const error = result instanceof Error ? this.formatError(result) : result;

    return {
      error,
      allowed: !error,
      path,
    };
  }

  private async processAndOp(op: Op, args: any[]): Promise<PolicyResult> {
    let result: PolicyResult = {} as never;

    for (const factor of op.factors) {
      result = await this.inspect(factor, ...args);

      if (!result.allowed) {
        return result;
      }
    }

    return result;
  }

  private async processOrOp(op: Op, args: any[]): Promise<PolicyResult> {
    let result: PolicyResult = {} as never;

    for (const factor of op.factors) {
      result = await this.inspect(factor, ...args);

      if (result.allowed) {
        return result;
      }
    }

    return result;
  }

  public async inspect(
    factor: AuthFactor,
    ...args: any[]
  ): Promise<PolicyResult> {
    if (isPolicyResult(factor)) {
      return factor;
    }

    if (typeof factor === 'string') {
      return this.processPolicy(factor, args);
    }

    if (factor.opcode === 'or') {
      return this.processOrOp(factor, args);
    } else {
      return this.processAndOp(factor, args);
    }
  }

  public async authorize(factor: AuthFactor, ...args: any[]): Promise<boolean> {
    const result = await this.inspect(factor, ...args);

    if (!result.allowed) {
      throw result.error;
    }

    return true;
  }

  public async check(factor: AuthFactor, ...args: any[]): Promise<boolean> {
    const result = await this.inspect(factor, ...args);

    return result.allowed;
  }

  public definePolicy({ name, predicate, presets }: PolicySettings): this {
    if (this.policies.has(name)) {
      throw new Error(`A policy named "${name}" has already been defined`);
    }

    this.policies.set(
      name,
      makePolicy({
        name,
        predicate,
        presets,
      }),
    );

    return this;
  }
}
