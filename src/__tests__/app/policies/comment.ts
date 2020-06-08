import { can, any, all, allow, PolicyFn, Policy } from '../access-control';
import { User, ArticleComment } from '../models';
import {
  isAuthor as isArticleAuthor,
  ArticlePolicy,
  ArticlePolicyFn,
} from './article';
import { hasRoles, isModerator, isAdmin } from './user';

export type CommentPolicyFn = (
  user: User,
  comment: ArticleComment,
) => ReturnType<PolicyFn>;

export type CommentPolicy = Policy<CommentPolicyFn>;

export const isAuthor: CommentPolicy = can(
  (user: User, comment: ArticleComment) => {
    if (user.id === comment.author.id) {
      return true;
    }

    return `${user.name} is not the author of comment (${comment.author.name} is).`;
  },
);

export const createComment: ArticlePolicy = any(
  isAdmin,
  isArticleAuthor,
  all<ArticlePolicyFn>(
    hasRoles('commenter'),
    (_user, article) => article.commentingEnabled,
  ),
);

export const editComment: CommentPolicy = any(isAdmin, isAuthor);

export const destroyComment: CommentPolicy = any(
  isAuthor,
  isModerator,
  (user, comment) => isArticleAuthor.inspect(user, comment.article),
);

export const readComment: CommentPolicy = allow();
