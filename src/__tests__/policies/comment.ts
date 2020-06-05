import { User, ArticleComment, Article } from '../models';
import { can, any, all, PolicyFn } from '../access-control';
import { hasRole } from '../policies/user';
import { isAuthor as isArticleAuthor } from '../policies/article';
import { isModerator, isAdmin } from '../policies/user';

type CommentPolicyFn = (
  user: User,
  comment: ArticleComment,
) => ReturnType<PolicyFn>;

export const isAuthor = can((user: User, comment: ArticleComment) => {
  if (user.id === comment.author.id) {
    return true;
  }

  return `${user.name} is not the author of comment (${comment.author.name} is).`;
});

export const isCommenter = can((user: User) => {
  return hasRole.inspect(user, 'commenter');
});

export const canCreate = can((user: User, article: Article) => {
  return all(isCommenter, article.commentingEnabled).inspect(user);
});

export const canEdit = can(async (user: User, comment: ArticleComment) => {
  return any<CommentPolicyFn>(isAdmin, isAuthor).inspect(user, comment);
});

export const canDestroy = can(async (user: User, comment: ArticleComment) => {
  return any<CommentPolicyFn>(
    isAdmin,
    isAuthor,
    isModerator,
    await isArticleAuthor.inspect(user, comment.article),
  ).inspect(user, comment);
});

export const canRead = can<CommentPolicyFn>(() => {
  return true;
});
