import * as articleController from './article';
import { users, articles } from '../data';
import { NotAuthorizedError, NotAuthenticatedError } from '../errors';

describe('Article Controller', () => {
  describe('reading an article', () => {
    it('does not require authentication.', async () => {
      await articleController.read(undefined as never, articles.python);
    });

    it('is allowed to anyone.', async () => {
      // eich is the lowest user
      await articleController.read(users.eich, articles.python);
    });
  });

  describe('creating an article', () => {
    it('is allowed to writers.', async () => {
      // guido is a writer
      await articleController.create(users.guido);
    });

    it('is allowed to admin.', async () => {
      // hopper is admin
      await articleController.create(users.hopper);
    });

    it('is denied to non writers.', async () => {
      expect.assertions(2);

      // pike is not a writer
      try {
        await articleController.create(users.pike);
      } catch (err) {
        expect(err).toBeInstanceOf(NotAuthorizedError);
        expect(err.message).toMatchInlineSnapshot(
          `"Rob Pike must have one of the following roles: \\"writer\\" - but has \\"moderator\\", \\"commenter\\"}"`,
        );
      }
    });

    it('requires authentication.', async () => {
      expect.assertions(2);

      try {
        await articleController.create(undefined as never);
      } catch (err) {
        expect(err).toBeInstanceOf(NotAuthenticatedError);
        expect(err.message).toMatchInlineSnapshot(
          `"User needs to be authenticated"`,
        );
      }
    });
  });

  describe('editing an article', () => {
    it('is allowed to article authors.', async () => {
      // guido is a writer
      await articleController.edit(users.guido, articles.python);
    });

    it('is allowed to admin.', async () => {
      // hopper is admin
      await articleController.edit(users.hopper, articles.python);
    });

    it('is denied to anyone but the author and admin.', async () => {
      expect.assertions(2);

      // pike is a moderator
      try {
        await articleController.edit(users.pike, articles.python);
      } catch (err) {
        expect(err).toBeInstanceOf(NotAuthorizedError);
        expect(err.message).toMatchInlineSnapshot(
          `"Rob Pike is not the author of article \\"The Python Programming Language\\""`,
        );
      }
    });

    it('requires authentication.', async () => {
      expect.assertions(2);

      try {
        await articleController.edit(undefined as never, articles.python);
      } catch (err) {
        expect(err).toBeInstanceOf(NotAuthenticatedError);
        expect(err.message).toMatchInlineSnapshot(
          `"User needs to be authenticated"`,
        );
      }
    });
  });

  describe('destroying an article', () => {
    it('is allowed to article authors.', async () => {
      // matz is the author of ruby.
      await articleController.destroy(users.matz, articles.ruby);
    });

    it('is allowed to admin.', async () => {
      // hopper is admin
      await articleController.destroy(users.hopper, articles.ruby);
    });

    it('is allowed to a moderator.', async () => {
      // pike is a moderator
      await articleController.destroy(users.pike, articles.ruby);
    });

    it('is denied to anyone but the author, admin and moderator.', async () => {
      expect.assertions(2);

      // guido is not a moderator, admin or the article author.
      try {
        await articleController.destroy(users.guido, articles.ruby);
      } catch (err) {
        expect(err).toBeInstanceOf(NotAuthorizedError);
        expect(err.message).toMatchInlineSnapshot(
          `"Guido van Rossum must have one of the following roles: \\"moderator\\" - but has \\"writer\\", \\"commenter\\"}"`,
        );
      }
    });

    it('requires authentication.', async () => {
      expect.assertions(2);

      try {
        await articleController.destroy(undefined as never, articles.ruby);
      } catch (err) {
        expect(err).toBeInstanceOf(NotAuthenticatedError);
        expect(err.message).toMatchInlineSnapshot(
          `"User needs to be authenticated"`,
        );
      }
    });
  });
});

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
