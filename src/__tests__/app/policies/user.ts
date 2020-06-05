import { can, matchRoles } from '../access-control';
import { User } from '../models';
import { NotAuthenticatedError } from '../errors';

function formatRoleString(roles: string[]): string {
  return roles.map((r) => `"${r}"`).join(', ');
}

export const hasRole = can((user: User, roles: string | string[]) => {
  const match = matchRoles(roles, user.roles);

  if (match.any) {
    return true;
  }

  const required = formatRoleString(match.required);
  const reachable = formatRoleString(match.reachable);

  return `${user.name} must have one of the following roles: ${required} - but has ${reachable}}`;
});

export const isAdmin = can((user: User) => {
  if (matchRoles('admin', user.roles).any) {
    return true;
  }

  return `User must have admin privilege`;
});

export const isModerator = can((user: User) => {
  return hasRole.inspect(user, 'moderator');
});

export const isAuthenticated = can((user?: User) => {
  if (!user) {
    return new NotAuthenticatedError('User needs to be authenticated');
  }

  return true;
});
