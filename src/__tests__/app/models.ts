export interface User {
  id: number;
  name: string;
  roles: string[];
  bio: string;
}

export interface Article {
  id: number;
  title: string;
  author: User;
  commentingEnabled: boolean;
}

export interface ArticleComment {
  author: User;
  article: Article;
}
