import hie from '@soufantech/hie';
import { AccessControl } from '../../access-control';
import { NotAuthorizedError } from './errors';
import roleHierarchy from './role-hierarchy.json';

export { PolicyFn, Policy } from '../../access-control';

export const matchRoles = hie(roleHierarchy);

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
