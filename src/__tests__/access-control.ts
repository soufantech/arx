import { RoleMatcher, HierarchicalRoleAuthority } from '../role-matcher';
import { AccessControl } from '../access-control';
import { NotAuthorizedError } from './errors';

export { PolicyFn } from '../access-control';

const roleMatcher = new RoleMatcher(
  new HierarchicalRoleAuthority({
    admin: ['moderator', 'writer'],
    moderator: ['commenter'],
    writer: ['commenter'],
    commenter: [],
  }),
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
