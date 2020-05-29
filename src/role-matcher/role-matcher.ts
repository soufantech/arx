export type AccessControlError = Error;

export interface RoleMatch {
  readonly all: boolean;
  readonly any: boolean;
  readonly matches: string[];
  readonly reachable: string[];
  readonly granted: string[];
  readonly required: string[];
}

export interface RoleAuthority {
  getReachableRoles(grantedRoles: string[]): string[];
}

function roleArgFilter(role: string): boolean {
  return role !== null && role !== undefined && role !== '';
}

export type RoleArg = string | string[];

export class RoleMatcher {
  private readonly roleAuthority: RoleAuthority;

  constructor(roleAuthority: RoleAuthority) {
    this.roleAuthority = roleAuthority;
  }

  public getReachableRoles(grantedRoles: RoleArg): string[] {
    const granted = ([] as string[]).concat(grantedRoles);

    return this.roleAuthority.getReachableRoles(granted);
  }

  public match(requiredRoles: RoleArg, grantedRoles: RoleArg): RoleMatch {
    const required = ([] as string[])
      .concat(requiredRoles)
      .filter(roleArgFilter);
    const granted = ([] as string[]).concat(grantedRoles).filter(roleArgFilter);

    const reachable = Array.from(
      new Set(this.roleAuthority.getReachableRoles(granted).concat(granted)),
    );

    const matches = required.filter((requiredRole) => {
      return reachable.includes(requiredRole);
    });

    const any = matches.length > 0;

    const all =
      required.every((requiredRole) => {
        return matches.includes(requiredRole);
      }) && any; // '&& any' garantees all is false if requiredRoles is an empty array;

    return {
      any,
      all,
      matches,
      required,
      granted,
      reachable,
    };
  }
}
