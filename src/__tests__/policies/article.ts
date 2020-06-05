import { User, Article } from '../models';
import { can, any, PolicyFn } from '../access-control';
import { hasRole, isAdmin, isModerator } from '../policies/user';

type ArticlePolicyFn = (user: User, article: Article) => ReturnType<PolicyFn>;

export const isAuthor = can((user: User, article: Article) => {
  if (article.author.id === user.id) {
    return true;
  }

  return `${user.name} is not the author of article "${article.title}"`;
});

export const canCreate = can((user: User) => {
  return hasRole.inspect(user, 'writer');
});

export const canEdit = can(async (user: User, article: Article) => {
  return any<ArticlePolicyFn>(isAdmin, isAuthor).inspect(user, article);
});

export const canDestroy = can(async (user: User, article: Article) => {
  return any<ArticlePolicyFn>(isAdmin, isAuthor, isModerator).inspect(
    user,
    article,
  );
});

export const canRead = can<ArticlePolicyFn>(() => {
  return true;
});
