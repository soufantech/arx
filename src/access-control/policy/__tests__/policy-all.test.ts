import { PolicyAll, PolicyCan } from '..';

const allow = new PolicyCan(() => true);
const deny1 = new PolicyCan(() => 'fail 1');
const deny2 = new PolicyCan(() => 'fail 2');

describe('PolicyAll', () => {
  describe('when all policies allow', () => {
    const allPass = new PolicyAll([allow, allow, allow]);

    it('inspect returns allows true and null error.', async () => {
      expect(await allPass.inspect()).toEqual(
        expect.objectContaining({
          allowed: true,
          error: null,
        }),
      );
    });

    it('authorize returns true.', async () => {
      const result = await allPass.check();

      expect(result).toBe(true);
    });

    it('check returns true.', async () => {
      const result = await allPass.authorize();

      expect(result).toBe(true);
    });
  });

  describe('when at least one of the policies deny', () => {
    const someFail = new PolicyAll([allow, deny1, allow, deny2]);

    it('inspect returns the first denied PolicyResult.', async () => {
      const result = await someFail.inspect();

      expect(result).toEqual(
        expect.objectContaining({
          allowed: false,
          error: expect.objectContaining({
            message: 'fail 1',
          }),
        }),
      );
    });

    it('authorize throws the error of the first denied policy.', async () => {
      expect.assertions(1);

      try {
        await someFail.authorize();
      } catch (err) {
        expect(err.message).toBe('fail 1');
      }
    });

    it('check returns false.', async () => {
      const result = await someFail.check();

      expect(result).toBe(false);
    });
  });

  it('throws an error when given an empty array.', async () => {
    expect(() => {
      new PolicyAll([]);
    }).toThrow(/at least one/);
  });
});
