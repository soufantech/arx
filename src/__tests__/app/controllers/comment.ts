import { User, Article, ArticleComment } from '../models';
import {
  createComment,
  editComment,
  destroyComment,
  readComment,
} from '../policies/comment';
import { isAuthenticated } from '../policies/user';

export async function create(user: User, article: Article): Promise<void> {
  await isAuthenticated.authorize(user);

  await createComment.authorize(user, article);
}

export async function edit(user: User, comment: ArticleComment): Promise<void> {
  await isAuthenticated.authorize(user);

  await editComment.authorize(user, comment);
}

export async function destroy(
  user: User,
  comment: ArticleComment,
): Promise<void> {
  await isAuthenticated.authorize(user);

  await destroyComment.authorize(user, comment);
}

export async function read(user: User, comment: ArticleComment): Promise<void> {
  await readComment.authorize(user, comment);
}
