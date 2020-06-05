import { User, Article, ArticleComment } from '../models';
import { canCreate, canEdit, canDestroy, canRead } from '../policies/comment';
import { isAuthenticated } from '../policies/user';

export async function create(user: User, article: Article): Promise<void> {
  await isAuthenticated.authorize(user);

  await canCreate.authorize(user, article);
}

export async function edit(user: User, comment: ArticleComment): Promise<void> {
  await isAuthenticated.authorize(user);

  await canEdit.authorize(user, comment);
}

export async function destroy(
  user: User,
  comment: ArticleComment,
): Promise<void> {
  await isAuthenticated.authorize(user);

  await canDestroy.authorize(user, comment);
}

export async function read(user: User, comment: ArticleComment): Promise<void> {
  await canRead.authorize(user, comment);
}
