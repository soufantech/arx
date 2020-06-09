import { AccessControl } from '../access-control';
import { NotAllowedError } from '../errors';

describe('AccessControl', () => {
  describe('allow', () => {
    it('always returns allowed true and null error.', async () => {
      const ac = new AccessControl();

      const resultAllowed = await ac.allow().inspect();

      expect(resultAllowed).toEqual(
        expect.objectContaining({
          allowed: true,
          error: null,
        }),
      );
    });
  });

  describe('deny', () => {
    it('always denies.', async () => {
      const ac = new AccessControl();

      const resultDenied = await ac.deny().inspect();

      expect(resultDenied).toEqual(
        expect.objectContaining({
          allowed: false,
          error: expect.any(NotAllowedError),
        }),
      );
    });

    it('returns a preformatted error if defined.', async () => {
      class CustomError extends Error {}

      const ac = new AccessControl({
        preformatError: (): CustomError => {
          return new CustomError(`Custom error`);
        },
      });

      const resultDenied = await ac.deny().inspect();

      expect(resultDenied).toEqual(
        expect.objectContaining({
          allowed: false,
          error: expect.any(CustomError),
        }),
      );

      expect(resultDenied.error).toEqual(
        expect.objectContaining({
          message: 'Custom error',
        }),
      );
    });

    it('returns a custom formatted error if defined.', async () => {
      class CustomError extends Error {}

      const ac = new AccessControl({
        formatError: (error): CustomError => {
          return new CustomError(`Custom error: ${error.message}`);
        },
      });

      const resultDenied = await ac.deny().inspect();

      expect(resultDenied).toEqual(
        expect.objectContaining({
          allowed: false,
          error: expect.any(CustomError),
        }),
      );

      expect(resultDenied.error).toEqual(
        expect.objectContaining({
          message: 'Custom error: Not allowed',
        }),
      );
    });
  });

  describe('can', () => {
    it('returns a policy whose result is defined by the return of the function argument.', async () => {
      const ac = new AccessControl();

      const policy = await ac.can((factor: boolean) => {
        return factor;
      });

      const resultAllowed = await policy.inspect(true);
      const resultDenied = await policy.inspect(false);

      expect(resultAllowed).toEqual(
        expect.objectContaining({
          allowed: true,
          error: null,
        }),
      );

      expect(resultDenied).toEqual(
        expect.objectContaining({
          allowed: false,
          error: expect.any(NotAllowedError),
        }),
      );
    });

    it('returns a preformatted error if defined.', async () => {
      class CustomError extends Error {}

      const ac = new AccessControl({
        preformatError: (message): CustomError => {
          return new CustomError(`Custom error: ${message}`);
        },
      });

      const resultDenied = await ac.can(() => 'sorry').inspect();

      expect(resultDenied).toEqual(
        expect.objectContaining({
          allowed: false,
          error: expect.any(CustomError),
        }),
      );

      expect(resultDenied.error).toEqual(
        expect.objectContaining({
          message: 'Custom error: sorry',
        }),
      );
    });

    it('returns a custom formatted error if defined.', async () => {
      class CustomError extends Error {}

      const ac = new AccessControl({
        formatError: (error): CustomError => {
          return new CustomError(`Custom error: ${error.message}`);
        },
      });

      const resultDenied = await ac.can(() => new Error('sorry')).inspect();

      expect(resultDenied).toEqual(
        expect.objectContaining({
          allowed: false,
          error: expect.any(CustomError),
        }),
      );

      expect(resultDenied.error).toEqual(
        expect.objectContaining({
          message: 'Custom error: sorry',
        }),
      );
    });
  });

  describe('any', () => {
    it('works with PolicyResult objects as arguments.', async () => {
      const ac = new AccessControl();

      const denied = await ac.deny().inspect();
      const allowed = await ac.allow().inspect();

      const resultAllowed = await ac.any(denied, allowed).inspect();
      const resultDenied = await ac.any(denied, denied).inspect();

      expect(resultAllowed).toEqual(
        expect.objectContaining({
          allowed: true,
          error: null,
        }),
      );

      expect(resultDenied).toEqual(
        expect.objectContaining({
          allowed: false,
          error: expect.any(NotAllowedError),
        }),
      );
    });

    it('works with Policy objects as arguments.', async () => {
      const ac = new AccessControl();

      const resultAllowed = await ac.any(ac.deny(), ac.allow()).inspect();
      const resultDenied = await ac.any(ac.deny(), ac.deny()).inspect();

      expect(resultAllowed).toEqual(
        expect.objectContaining({
          allowed: true,
          error: null,
        }),
      );

      expect(resultDenied).toEqual(
        expect.objectContaining({
          allowed: false,
          error: expect.any(NotAllowedError),
        }),
      );
    });

    it('works with booleans as arguments.', async () => {
      const ac = new AccessControl();

      const resultAllowed = await ac.any(false, true).inspect();
      const resultDenied = await ac.any(false, false).inspect();

      expect(resultAllowed).toEqual(
        expect.objectContaining({
          allowed: true,
          error: null,
        }),
      );

      expect(resultDenied).toEqual(
        expect.objectContaining({
          allowed: false,
          error: expect.any(NotAllowedError),
        }),
      );
    });

    it('works with functions as arguments.', async () => {
      const ac = new AccessControl();

      const resultAllowed = await ac
        .any<() => boolean>(
          () => false,
          () => true,
        )
        .inspect();

      const resultDenied = await ac
        .any(
          () => false,
          () => false,
        )
        .inspect();

      expect(resultAllowed).toEqual(
        expect.objectContaining({
          allowed: true,
          error: null,
        }),
      );

      expect(resultDenied).toEqual(
        expect.objectContaining({
          allowed: false,
          error: expect.any(NotAllowedError),
        }),
      );
    });

    it('returns the last ocurred error if none allow.', async () => {
      class CustomError extends Error {}

      const ac = new AccessControl();

      const resultDenied = await ac
        .any(
          false,
          ac.deny(),
          await ac.deny().inspect(),
          () => new CustomError('1'),
        )
        .inspect();

      expect(resultDenied.error).toBeInstanceOf(CustomError);
      expect(resultDenied.error).toEqual(
        expect.objectContaining({
          message: '1',
        }),
      );
    });

    it('returns allows true if at least one policy allow.', async () => {
      class CustomError extends Error {}

      const ac = new AccessControl();

      const resultAllowed = await ac
        .any(
          () => new CustomError('1'),
          false,
          ac.deny(),
          await ac.deny().inspect(),
          true, // <- allow
        )
        .inspect();

      expect(resultAllowed).toEqual(
        expect.objectContaining({
          allowed: true,
          error: null,
        }),
      );
    });
  });

  describe('all', () => {
    it('returns the first occurred error.', async () => {
      class CustomError extends Error {}

      const ac = new AccessControl();

      const resultDenied = await ac
        .all(
          true,
          ac.allow(),
          () => true,
          await ac.allow().inspect(),
          () => new CustomError('1'), // <- to be returned.
          ac.deny(), // <- second error, not to be returned.
        )
        .inspect();

      expect(resultDenied.error).toBeInstanceOf(CustomError);
      expect(resultDenied.error).toEqual(
        expect.objectContaining({
          message: '1',
        }),
      );
    });

    it('returns allows true if at least one policy allow.', async () => {
      class CustomError extends Error {}

      const ac = new AccessControl();

      const resultAllowed = await ac
        .any(
          () => new CustomError('1'),
          false,
          ac.deny(),
          await ac.deny().inspect(),
          true, // <- to be returned
        )
        .inspect();

      expect(resultAllowed).toEqual(
        expect.objectContaining({
          allowed: true,
          error: null,
        }),
      );
    });

    it('works with PolicyResult objects as arguments.', async () => {
      const ac = new AccessControl();

      const denied = await ac.deny().inspect();
      const allowed = await ac.allow().inspect();

      const resultAllowed = await ac.all(allowed, allowed).inspect();
      const resultDenied = await ac.all(allowed, denied).inspect();

      expect(resultAllowed).toEqual(
        expect.objectContaining({
          allowed: true,
          error: null,
        }),
      );

      expect(resultDenied).toEqual(
        expect.objectContaining({
          allowed: false,
          error: expect.any(NotAllowedError),
        }),
      );
    });

    it('works with Policy objects as arguments.', async () => {
      const ac = new AccessControl();

      const resultAllowed = await ac.all(ac.allow(), ac.allow()).inspect();
      const resultDenied = await ac.all(ac.allow(), ac.deny()).inspect();

      expect(resultAllowed).toEqual(
        expect.objectContaining({
          allowed: true,
          error: null,
        }),
      );

      expect(resultDenied).toEqual(
        expect.objectContaining({
          allowed: false,
          error: expect.any(NotAllowedError),
        }),
      );
    });

    it('works with booleans as arguments.', async () => {
      const ac = new AccessControl();

      const resultAllowed = await ac.all(true, true).inspect();
      const resultDenied = await ac.all(true, false).inspect();

      expect(resultAllowed).toEqual(
        expect.objectContaining({
          allowed: true,
          error: null,
        }),
      );

      expect(resultDenied).toEqual(
        expect.objectContaining({
          allowed: false,
          error: expect.any(NotAllowedError),
        }),
      );
    });

    it('works with functions as arguments.', async () => {
      const ac = new AccessControl();

      const resultAllowed = await ac
        .all(
          () => true,
          () => true,
        )
        .inspect();

      const resultDenied = await ac
        .all<() => boolean>(
          () => true,
          () => false,
        )
        .inspect();

      expect(resultAllowed).toEqual(
        expect.objectContaining({
          allowed: true,
          error: null,
        }),
      );

      expect(resultDenied).toEqual(
        expect.objectContaining({
          allowed: false,
          error: expect.any(NotAllowedError),
        }),
      );
    });
  });

  it('can be integrated with other AccessControl instances', async () => {
    class WrapperError extends Error {
      constructor(public readonly originalError: Error) {
        super(originalError.message);
      }
    }

    class CustomError extends Error {}

    const ac1 = new AccessControl();

    const ac2 = new AccessControl({
      preformatError: (message): CustomError => {
        return new CustomError(message);
      },
    });

    const ac3 = new AccessControl({
      formatError: (error): WrapperError => {
        return new WrapperError(error);
      },
    });

    const resultAllowed = await ac3
      .any(
        ac1.deny(),
        ac3.all(true, ac1.allow()),
        ac2.can(() => 'Denied!'),
      )
      .inspect();

    expect(resultAllowed).toEqual(
      expect.objectContaining({
        allowed: true,
        error: null,
      }),
    );

    const resultDenied = await ac3
      .can(async () => ac1.all(ac2.can(() => 'Denied!')).inspect())
      .inspect();

    expect(resultDenied.error).toBeInstanceOf(WrapperError);
    expect(resultDenied.error).toEqual(
      expect.objectContaining({
        message: 'Denied!',
      }),
    );

    expect((resultDenied.error as WrapperError).originalError).toBeInstanceOf(
      CustomError,
    );
    expect((resultDenied.error as WrapperError).originalError).toEqual(
      expect.objectContaining({
        message: 'Denied!',
      }),
    );
  });
});
