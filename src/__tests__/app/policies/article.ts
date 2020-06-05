import { User, Article } from '../models';
import { can, any, PolicyFn } from '../access-control';
import { hasRole, isAdmin, isModerator } from './user';

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

export const createArticle = can((user: User) => {
  return hasRole.inspect(user, 'writer');
});

export const editArticle = can(async (user: User, article: Article) => {
  return any(isAdmin, isAuthor).inspect(user, article);
});

export const destroyArticle = can(async (user: User, article: Article) => {
  return any(isAdmin, isAuthor, isModerator).inspect(user, article);
});

export const readArticle = can<ArticlePolicyFn>(() => {
  return true;
});
