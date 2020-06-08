import { User, ArticleComment } from '../models';
import { can, any, all, PolicyFn } from '../access-control';
import { hasRoles } from './user';
import { isAuthor as isArticleAuthor, ArticlePolicyFn } from './article';
import { isModerator, isAdmin } from './user';

export type CommentPolicyFn = (
  user: User,
  comment: ArticleComment,
) => ReturnType<PolicyFn>;

export const isAuthor = can((user: User, comment: ArticleComment) => {
  if (user.id === comment.author.id) {
    return true;
  }

  return `${user.name} is not the author of comment (${comment.author.name} is).`;
});

export const createComment = any(
  isAdmin,
  isArticleAuthor,
  all<ArticlePolicyFn>(
    hasRoles('commenter'),
    (_user, article) => article.commentingEnabled,
  ),
);

export const editComment = any(isAdmin, isAuthor);

export const destroyComment = any<CommentPolicyFn>(
  isAuthor,
  isModerator,
  (user, comment) => isArticleAuthor.inspect(user, comment.article),
);

export const readComment = can<CommentPolicyFn>(() => true);
