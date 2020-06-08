import { can, matchRoles, PolicyFn } from '../access-control';
import { User } from '../models';
import { NotAuthenticatedError } from '../errors';
import { Policy } from '../../../access-control';

function formatRoleString(roles: string[]): string {
  return roles.map((r) => `"${r}"`).join(', ');
}

export type UserPolicyFn = (user: User) => ReturnType<PolicyFn>;

export function hasRoles(roles: string | string[]): Policy<UserPolicyFn> {
  return can((user: User): string | true => {
    const match = matchRoles(roles, user.roles);

    if (match.any) {
      return true;
    }

    const required = formatRoleString(match.required);
    const reachable = formatRoleString(match.reachable);

    return `${user.name} must have one of the following roles: ${required} - but has ${reachable}}`;
  });
}

export const isAdmin = hasRoles('admin');

export const isModerator = hasRoles('moderator');

export const isAuthenticated = can((user?: User) => {
  if (!user) {
    return new NotAuthenticatedError('User needs to be authenticated');
  }

  return true;
});
