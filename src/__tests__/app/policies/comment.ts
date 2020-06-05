import { User, ArticleComment, Article } from '../models';
import { can, any, all, PolicyFn } from '../access-control';
import { hasRole } from './user';
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

export const isCommenter = can((user: User) => {
  return hasRole.inspect(user, 'commenter');
});

export const createComment = can((user: User, article: Article) => {
  return any<ArticlePolicyFn>(
    isAdmin,
    isArticleAuthor,
    all(isCommenter, article.commentingEnabled),
  ).inspect(user, article);
});

export const editComment = can(async (user: User, comment: ArticleComment) => {
  return any(isAdmin, isAuthor).inspect(user, comment);
});

export const destroyComment = can(
  async (user: User, comment: ArticleComment) => {
    return any(
      isAuthor,
      isModerator,
      await isArticleAuthor.inspect(user, comment.article),
    ).inspect(user, comment);
  },
);

export const readComment = can<CommentPolicyFn>(() => {
  return true;
});
