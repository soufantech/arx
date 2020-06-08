import { RoleMatcher, HierarchicalRoleAuthority } from '../../role-matcher';
import { AccessControl } from '../../access-control';
import { NotAuthorizedError } from './errors';
import roleHierarchy from './role-hierarchy.json';

export { PolicyFn } from '../../access-control';

const roleMatcher = new RoleMatcher(
  new HierarchicalRoleAuthority(roleHierarchy),
);

export const matchRoles: RoleMatcher['match'] = roleMatcher.match.bind(
  roleMatcher,
);

export const accessControl = new AccessControl({
  preformatError(message): NotAuthorizedError {
    return new NotAuthorizedError(message ?? 'Not authorized');
  },
});

export const can: AccessControl['can'] = accessControl.can.bind(accessControl);
export const all: AccessControl['all'] = accessControl.all.bind(accessControl);
export const any: AccessControl['any'] = accessControl.any.bind(accessControl);
export const allow: AccessControl['allow'] = accessControl.allow.bind(
  accessControl,
);
export const deny: AccessControl['deny'] = accessControl.deny.bind(
  accessControl,
);
