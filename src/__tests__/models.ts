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

/*
  larry                           COMMENTER        
  matz                    WRITER  COMMENTER
  guido                   WRITER  COMMENTER
  bjarne                                   
  pike          MODERATOR         COMMENTER
  eich
  hopper  ADMIN MODERATOR WRITER  COMMENTER
  gosling       MODERATOR         COMMENTER
  dennis        MODERATOR WRITER  COMMENTER
 */

export const users: Record<string, User> = {
  larry: {
    id: 1,
    name: 'Larry Wall',
    bio: 'Designer of Perl',
    roles: ['commenter'],
  },

  matz: {
    id: 2,
    name: 'Yukihiro Matsumoto',
    bio: 'Designer of Ruby',
    roles: ['writer'],
  },

  guido: {
    id: 3,
    name: 'Guido van Rossum',
    bio: 'Designer of C++',
    roles: ['writer'],
  },

  bjarne: {
    id: 4,
    name: 'Bjarne Stroustrup',
    bio: 'Designer of C++',
    roles: [],
  },

  pike: {
    id: 5,
    name: 'Rob Pike',
    bio: 'Co-designer of Limbo and Go',
    roles: ['moderator', 'commenter'],
  },

  eich: {
    id: 6,
    name: 'Brendan Eich',
    bio: 'Designer of JavaScript',
    roles: [],
  },

  hopper: {
    id: 7,
    name: 'Grace Hopper',
    bio: 'Co-designer of COBOL',
    roles: ['admin'],
  },

  gosling: {
    id: 8,
    name: 'James Gosling',
    bio: 'Designer of Java',
    roles: [],
  },

  dennis: {
    id: 9,
    name: 'Dennis Ritchie',
    bio: 'Designer of C',
    roles: ['moderator', 'writer'],
  },
};

export const articles: Record<string, Article> = {
  ruby: {
    id: 2,
    title: 'The Ruby Programming Language',
    author: users.matz,
    commentingEnabled: true,
  },

  python: {
    id: 1,
    title: 'The Python Programming Language',
    author: users.guido,
    commentingEnabled: false,
  },

  cobol: {
    id: 1,
    title: 'The COBOL Programming Language',
    author: users.hopper,
    commentingEnabled: true,
  },

  clang: {
    id: 2,
    title: 'The C Programming Language',
    author: users.dennis,
    commentingEnabled: true,
  },
};

export const comments: Record<string, ArticleComment> = {
  larryOnClang: {
    author: users.larry,
    article: articles.clang,
  },

  larryOnRuby: {
    author: users.larry,
    article: articles.clang,
  },

  dennisOnPython: {
    author: users.dennis,
    article: articles.python,
  },

  pikeOnPython: {
    author: users.pike,
    article: articles.python,
  },

  hopperOnClang: {
    author: users.hopper,
    article: articles.clang,
  },

  matzOnRuby: {
    author: users.matz,
    article: articles.ruby,
  },
};
