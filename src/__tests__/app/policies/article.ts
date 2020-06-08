import { can, any, allow, PolicyFn, Policy } from '../access-control';
import { User, Article } from '../models';
import { isAdmin, isModerator, hasRoles } from './user';

export type ArticlePolicyFn = (
  user: User,
  article: Article,
) => ReturnType<PolicyFn>;

export type ArticlePolicy = Policy<ArticlePolicyFn>;

export const isAuthor: ArticlePolicy = can((user: User, article: Article) => {
  if (article.author.id === user.id) {
    return true;
  }

  return `${user.name} is not the author of article "${article.title}"`;
});

export const createArticle = hasRoles('writer');

export const editArticle: ArticlePolicy = any(isAdmin, isAuthor);

export const destroyArticle: ArticlePolicy = any(
  isAdmin,
  isAuthor,
  isModerator,
);

export const readArticle: ArticlePolicy = allow<ArticlePolicyFn>();
