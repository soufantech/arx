import * as commentController from '../controllers/comment';
import { users, comments, articles } from '../data';
import { NotAuthorizedError, NotAuthenticatedError } from '../errors';

describe('comment', () => {
  describe('reading', () => {
    it('does not require authentication.', async () => {
      await commentController.read(undefined as never, comments.larryOnRuby);
    });

    it('is allowed to anyone.', async () => {
      // eich is the user with lowest privileges.
      await commentController.read(users.eich, comments.larryOnRuby);
    });
  });

  describe('creation', () => {
    it('is allowed to writer, admin, commenter, and moderator.', async () => {
      // guido is a writer.
      await commentController.create(users.guido, articles.clang);

      // pike is a moderator.
      await commentController.create(users.pike, articles.clang);

      // larry is a commenter.
      await commentController.create(users.larry, articles.clang);

      // hopper is an admin.
      await commentController.create(users.hopper, articles.clang);

      // dennis is the author of the article.
      await commentController.create(users.dennis, articles.clang);
    });

    describe('on non-commentable article', () => {
      it('is generally denied.', async () => {
        try {
          // python is non-commentable
          await commentController.create(users.larry, articles.python);
        } catch (err) {
          expect(err).toBeInstanceOf(NotAuthorizedError);
          expect(err.message).toMatchInlineSnapshot(`"Not authorized"`);
        }
      });

      it('is allowed to admin.', async () => {
        // python is non-commentable, but hopper is admin and can
        // create a comment anyway.
        await commentController.create(users.hopper, articles.python);
      });

      it('is allowed to article author.', async () => {
        // guido is author of article python, so that's ok.
        await commentController.create(users.guido, articles.python);
      });
    });

    it('is denied to those with role lesser than commenter.', async () => {
      expect.assertions(2);

      try {
        // eich is a non commenter.
        await commentController.create(users.eich, articles.clang);
      } catch (err) {
        expect(err).toBeInstanceOf(NotAuthorizedError);
        expect(err.message).toMatchInlineSnapshot(
          `"Brendan Eich must have one of the following roles: \\"commenter\\" - but has }"`,
        );
      }
    });

    it('requires authentication.', async () => {
      expect.assertions(2);

      try {
        await commentController.create(undefined as never, articles.clang);
      } catch (err) {
        expect(err).toBeInstanceOf(NotAuthenticatedError);
        expect(err.message).toMatchInlineSnapshot(
          `"User needs to be authenticated"`,
        );
      }
    });
  });

  describe('editing', () => {
    it('is allowed to comment authors.', async () => {
      // larry wrote a comment on matz's article.
      await commentController.edit(users.larry, comments.larryOnRuby);
    });

    it('is allowed to admin.', async () => {
      // hopper is admin
      await commentController.edit(users.hopper, comments.larryOnRuby);
    });

    it('is denied to the article author.', async () => {
      expect.assertions(2);

      // matz is the author of the article on which larry wrote a comment.
      try {
        await commentController.edit(users.matz, comments.larryOnRuby);
      } catch (err) {
        expect(err).toBeInstanceOf(NotAuthorizedError);
        expect(err.message).toMatchInlineSnapshot(
          `"Yukihiro Matsumoto is not the author of comment (Larry Wall is)."`,
        );
      }
    });

    it('is denied to moderators.', async () => {
      expect.assertions(2);

      // dennis is a moderator, a writer and a commenter, but is not
      // the author of the comment or admin.
      try {
        await commentController.edit(users.dennis, comments.larryOnRuby);
      } catch (err) {
        expect(err).toBeInstanceOf(NotAuthorizedError);
        expect(err.message).toMatchInlineSnapshot(
          `"Dennis Ritchie is not the author of comment (Larry Wall is)."`,
        );
      }
    });

    it('requires authentication.', async () => {
      expect.assertions(2);

      try {
        await commentController.edit(undefined as never, comments.larryOnRuby);
      } catch (err) {
        expect(err).toBeInstanceOf(NotAuthenticatedError);
        expect(err.message).toMatchInlineSnapshot(
          `"User needs to be authenticated"`,
        );
      }
    });
  });

  describe('destroying', () => {
    it('is allowed to the comment author.', async () => {
      // larry wrote a comment on matz's article.
      await commentController.destroy(users.larry, comments.larryOnRuby);
    });

    it('is allowed to admin.', async () => {
      // hopper is admin.
      await commentController.destroy(users.hopper, comments.larryOnRuby);
    });

    it('is allowed to the article author.', async () => {
      // matz can destroy a comment larry wrote on his article.
      await commentController.destroy(users.larry, comments.larryOnRuby);
    });

    it('is allowed to moderators.', async () => {
      // pike is a moderator.
      await commentController.destroy(users.pike, comments.larryOnRuby);
    });

    it('is denied to non admin, moderator, article author or comment author.', async () => {
      expect.assertions(2);

      try {
        // larry is not admin, moderator, the article author or the comment author
        await commentController.destroy(users.lary, comments.dennisOnCobol);
      } catch (err) {
        expect(err).toBeInstanceOf(NotAuthenticatedError);
        expect(err.message).toMatchInlineSnapshot(
          `"User needs to be authenticated"`,
        );
      }
    });

    it('requires authentication.', async () => {
      expect.assertions(2);

      try {
        await commentController.destroy(
          undefined as never,
          comments.larryOnRuby,
        );
      } catch (err) {
        expect(err).toBeInstanceOf(NotAuthenticatedError);
        expect(err.message).toMatchInlineSnapshot(
          `"User needs to be authenticated"`,
        );
      }
    });
  });
});
