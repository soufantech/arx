import { User, Article } from '../models';
import {
  createArticle,
  editArticle,
  destroyArticle,
  readArticle,
} from '../policies/article';
import { isAuthenticated } from '../policies/user';

export async function create(user: User): Promise<void> {
  await isAuthenticated.authorize(user);

  await createArticle.authorize(user);
}

export async function edit(user: User, article: Article): Promise<void> {
  await isAuthenticated.authorize(user);

  await editArticle.authorize(user, article);
}

export async function destroy(user: User, article: Article): Promise<void> {
  await isAuthenticated.authorize(user);

  await destroyArticle.authorize(user, article);
}

export async function read(user: User, article: Article): Promise<void> {
  await readArticle.authorize(user, article);
}
