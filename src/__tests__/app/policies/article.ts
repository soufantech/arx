import { User, Article } from '../models';
import { can, any, PolicyFn } from '../access-control';
import { isAdmin, isModerator, hasRoles } from './user';

export type ArticlePolicyFn = (
  user: User,
  article: Article,
) => ReturnType<PolicyFn>;

export const isAuthor = can((user: User, article: Article) => {
  if (article.author.id === user.id) {
    return true;
  }

  return `${user.name} is not the author of article "${article.title}"`;
});

export const createArticle = hasRoles('writer');

export const editArticle = any(isAdmin, isAuthor);

export const destroyArticle = any(isAdmin, isAuthor, isModerator);

export const readArticle = can<ArticlePolicyFn>(() => true);
