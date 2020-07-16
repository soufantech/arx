import { NotAllowedError } from '../../errors';
import { PolicyCan, PolicyCanSettings } from '..';

describe('PolicyCan', () => {
  const isSelf = new PolicyCan((a: number, b: number) => {
    return a === b;
  });

  describe('when policy function returns true', () => {
    it('inspect returns allowed true and null error.', async () => {
      expect(await isSelf.inspect(5, 5)).toEqual(
        expect.objectContaining({
          allowed: true,
          error: null,
        }),
      );
    });

    it('authorize returns true.', async () => {
      expect(await isSelf.authorize(5, 5)).toBe(true);
    });

    it('check returns true.', async () => {
      expect(await isSelf.check(5, 5)).toBe(true);
    });
  });

  describe('when policy function returns false', () => {
    it('inspect returns allowed false and default error.', async () => {
      const result = await isSelf.inspect(5, 3);

      expect(result).toEqual(
        expect.objectContaining({
          allowed: false,
          error: expect.any(NotAllowedError),
        }),
      );

      expect(result.error).toEqual(
        expect.objectContaining({
          message: 'Not allowed',
        }),
      );
    });

    it('authorize throws default exception.', async () => {
      expect.assertions(2);

      try {
        await isSelf.authorize(5, 3);
      } catch (err) {
        expect(err).toBeInstanceOf(NotAllowedError);
        expect(err.message).toBe('Not allowed');
      }
    });

    it('check returns false.', async () => {
      expect(await isSelf.check(5, 3)).toBe(false);
    });
  });

  describe('when policy function returns a string', () => {
    const isSelf = new PolicyCan((a: number, b: number) => {
      if (a === b) {
        return true;
      }

      return `${a} is not ${b}!`;
    });

    it('inspect returns allowed false and default error with string as message.', async () => {
      const result = await isSelf.inspect(5, 3);

      expect(result).toEqual(
        expect.objectContaining({
          allowed: false,
          error: expect.any(NotAllowedError),
        }),
      );

      expect(result.error).toEqual(
        expect.objectContaining({
          message: '5 is not 3!',
        }),
      );
    });

    it('authorize throws default exception with string as message.', async () => {
      expect.assertions(2);

      try {
        await isSelf.authorize(5, 3);
      } catch (err) {
        expect(err).toBeInstanceOf(NotAllowedError);
        expect(err.message).toBe('5 is not 3!');
      }
    });

    it('check returns false.', async () => {
      expect(await isSelf.check(5, 3)).toBe(false);
    });

    it('string is passed to preformatError.', async () => {
      const settings: PolicyCanSettings = {
        preformatError: jest.fn((message) => {
          return new Error(message);
        }),
      };

      const forbidden = new PolicyCan(() => {
        return `Forbidden!`;
      }, settings);

      const result = await forbidden.inspect();

      expect(settings.preformatError).toHaveBeenCalledWith('Forbidden!');
      expect(result.error).toEqual(
        expect.objectContaining({
          message: 'Forbidden!',
        }),
      );
    });
  });

  describe('when policy function returns an error', () => {
    class NotSelfError extends Error {}

    const isSelf = new PolicyCan((a: number, b: number) => {
      if (a === b) {
        return true;
      }

      return new NotSelfError(`${a} is not ${b}!`);
    });

    it('inspect returns the error untouched.', async () => {
      const result = await isSelf.inspect(5, 3);

      expect(result).toEqual(
        expect.objectContaining({
          allowed: false,
          error: expect.any(NotSelfError),
        }),
      );

      expect(result.error).toEqual(
        expect.objectContaining({
          message: '5 is not 3!',
        }),
      );
    });

    it('authorize throws the custom exception.', async () => {
      expect.assertions(2);

      try {
        await isSelf.authorize(5, 3);
      } catch (err) {
        expect(err).toBeInstanceOf(NotSelfError);
        expect(err.message).toBe('5 is not 3!');
      }
    });

    it('check returns false.', async () => {
      expect(await isSelf.check(5, 3)).toBe(false);
    });

    it('preformatError is ignored.', async () => {
      const settings: PolicyCanSettings = {
        preformatError: jest.fn((message) => {
          return new Error(message);
        }),
      };

      const notSelf = new PolicyCan(() => {
        return new NotSelfError('Not self');
      }, settings);

      const result = await notSelf.inspect();

      expect(settings.preformatError).toHaveBeenCalledTimes(0);
      expect(result.error).toBeInstanceOf(NotSelfError);
    });
  });

  describe('when policy function returns an instance of PolicyResult', () => {
    class NotEvenError extends Error {}
    class NotDivisibleByTwoError extends Error {}
    class NotDivisibleByTenError extends Error {}

    const isDivisibleByTwo = new PolicyCan((n: number) => {
      if (n % 2 === 0) {
        return true;
      }

      return new NotDivisibleByTwoError(`${n} is not divisible by two!`);
    });

    const isEven = new PolicyCan(async (n: number) => {
      const result = await isDivisibleByTwo.inspect(n);
      if (result.allowed) {
        return result;
      }

      return new NotEvenError(`${n} is not even!`);
    });

    const isDivisibleByTen = new PolicyCan(async (n: number) => {
      const result = await isEven.inspect(n);

      if (!result.allowed) {
        return result;
      }

      if (n % 10 === 0) {
        return true;
      }

      return new NotDivisibleByTenError(`${n} is not divisible by ten!`);
    });

    it('inspect returns the same PolicyResult if allowed.', async () => {
      const result = await isEven.inspect(130);

      expect(result).toEqual(
        expect.objectContaining({
          allowed: true,
          error: null,
        }),
      );
    });

    it('check returns true if the PolicyResult is allowed.', async () => {
      const result = await isEven.check(130);

      expect(result).toBe(true);
    });

    it('authorize returns true if the PolicyResult is allowed.', async () => {
      const result = await isEven.authorize(130);

      expect(result).toBe(true);
    });

    it('inspect returns PolicyResult error if not allowed.', async () => {
      const result1 = await isDivisibleByTen.inspect(131);
      const result2 = await isDivisibleByTen.inspect(132);

      expect(result1).toEqual(
        expect.objectContaining({
          allowed: false,
          error: expect.any(NotEvenError),
        }),
      );

      expect(result2).toEqual(
        expect.objectContaining({
          allowed: false,
          error: expect.any(NotDivisibleByTenError),
        }),
      );
    });

    it('authorize throws the PolicyResult error if not allowed.', async () => {
      expect.assertions(4);

      try {
        await isDivisibleByTen.authorize(131);
      } catch (err) {
        expect(err).toBeInstanceOf(NotEvenError);
        expect(err.message).toBe('131 is not even!');
      }

      try {
        await isDivisibleByTen.authorize(132);
      } catch (err) {
        expect(err).toBeInstanceOf(NotDivisibleByTenError);
        expect(err.message).toBe('132 is not divisible by ten!');
      }
    });

    it('check returns false if some PolicyResult was not allowed.', async () => {
      const result1 = await isDivisibleByTen.check(131);
      const result2 = await isDivisibleByTen.check(132);

      expect(result1).toBe(false);
      expect(result2).toBe(false);
    });
  });

  it('message is undefined in preformatError if a string is not returned.', async () => {
    class PreformattedError extends Error {}

    const settings: PolicyCanSettings = {
      preformatError: jest.fn(() => {
        return new PreformattedError(`Forbidden for no apparent reason`);
      }),
    };

    const forbidden = new PolicyCan(() => {
      return false;
    }, settings);

    await forbidden.inspect();

    expect(settings.preformatError).toHaveBeenLastCalledWith(undefined);
  });

  it('throws an error when a function is not given.', async () => {
    expect(() => {
      new PolicyCan(undefined as never);
    }).toThrow(/function/);
  });

  it('throws an error when the function parameter receives an argument that is not a function.', async () => {
    expect(() => {
      new PolicyCan({} as never);
    }).toThrow(/function/);
  });
});
