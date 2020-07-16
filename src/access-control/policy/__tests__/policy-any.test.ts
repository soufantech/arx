import { PolicyAny, PolicyCan } from '..';

const allow = new PolicyCan(() => true);
const deny1 = new PolicyCan(() => 'fail 1');
const deny2 = new PolicyCan(() => 'fail 2');

describe('PolicyAny', () => {
  describe('when at least one policy allow.', () => {
    const somePass = new PolicyAny([deny1, allow, deny2, allow]);

    it('inspect returns allowed true and null error.', async () => {
      expect(await somePass.inspect()).toEqual(
        expect.objectContaining({
          allowed: true,
          error: null,
        }),
      );
    });

    it('authorize returns true.', async () => {
      const result = await somePass.check();

      expect(result).toBe(true);
    });

    it('check returns true.', async () => {
      const result = await somePass.authorize();

      expect(result).toBe(true);
    });
  });

  describe('when all policies deny', () => {
    const allFail = new PolicyAny([deny1, deny2]);

    it('inspect returns the error of the last denied policy.', async () => {
      const result = await allFail.inspect();

      expect(result).toEqual(
        expect.objectContaining({
          allowed: false,
          error: expect.objectContaining({
            message: 'fail 2',
          }),
        }),
      );
    });

    it('authorize throws the error of the last denied policy.', async () => {
      expect.assertions(1);

      try {
        await allFail.authorize();
      } catch (err) {
        expect(err.message).toBe('fail 2');
      }
    });

    it('check returns false.', async () => {
      const result = await allFail.check();

      expect(result).toBe(false);
    });
  });

  it('throws an error when given an empty array.', async () => {
    expect(() => {
      new PolicyAny([]);
    }).toThrow(/at least one/);
  });
});
