export type RoleHierarchyRepresentation = Record<string, string[]>;
import { RoleAuthority } from './role-matcher';
import { ArxError } from '../errors';

export class HierarchyMappingError extends ArxError {}

type HierarchyMapping = Record<string, string[]>;

export class HierarchicalRoleAuthority implements RoleAuthority {
  private mapping: HierarchyMapping;

  constructor(representation: RoleHierarchyRepresentation) {
    this.mapping = this.map(representation);
  }

  public setHierarchy(representation: RoleHierarchyRepresentation): void {
    this.mapping = this.map(representation);
  }

  public getReachableRoles(grantedRoles: string[]): string[] {
    return Array.from(
      grantedRoles.reduce((set, grantedRole) => {
        // XXX: maybe constructing new set would be more performant?
        (this.mapping[grantedRole] ?? []).forEach((r) => set.add(r));

        return set;
      }, new Set<string>([])),
    );
  }

  public getMapping(): HierarchyMapping {
    return this.mapping;
  }

  private map(representation: RoleHierarchyRepresentation): HierarchyMapping {
    const mapping: HierarchyMapping = {};

    function traverse(role: string, path: string[]): string[] {
      const subjects = representation[role];

      if (mapping[role] == null) {
        mapping[role] = [role];
      }

      if (subjects == null) {
        return [];
      }

      if (path.includes(role)) {
        path.push(role);
        const pathGraphic = path
          .map((r) => {
            return r === role ? `[${r}]` : r;
          })
          .join(' > ');
        throw new HierarchyMappingError(
          `Circular reference error: role [${role}] is backreferenced in path ${pathGraphic}`,
        );
      }

      path.push(role);

      mapping[role] = [role, ...subjects];

      for (const subject of subjects) {
        for (const subsub of traverse(subject, [...path])) {
          if (!mapping[role].includes(subsub)) {
            mapping[role].push(subsub);
          }
        }
      }

      return mapping[role];
    }

    for (const node of Object.keys(representation)) {
      traverse(node, []);
    }

    return mapping;
  }
}
