import { User, Article } from '../models';
import { canCreate, canEdit, canDestroy, canRead } from '../policies/article';
import { isAuthenticated } from '../policies/user';

export async function create(user: User): Promise<void> {
  await isAuthenticated.authorize(user);

  await canCreate.authorize(user);
}

export async function edit(user: User, article: Article): Promise<void> {
  await isAuthenticated.authorize(user);

  await canEdit.authorize(user, article);
}

export async function destroy(user: User, article: Article): Promise<void> {
  await isAuthenticated.authorize(user);

  await canDestroy.authorize(user, article);
}

export async function read(user: User, article: Article): Promise<void> {
  await canRead.authorize(user, article);
}
