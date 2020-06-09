import { RoleMatcher } from '../role-matcher';
import { HierarchicalRoleAuthority } from '../hierarchical-role-authority';

describe('RoleMatcher', () => {
  describe('with authority', () => {
    const HIERARCHY = {
      a: ['b', 'c'],
      b: ['d'],
      c: ['d'],
      d: ['e'],
    };

    const matcher = new RoleMatcher(new HierarchicalRoleAuthority(HIERARCHY));

    it('can be queried about all the reachable roles given the granted roles', () => {
      expect(matcher.getReachableRoles(['a', 'e'])).toMatchInlineSnapshot(`
        Array [
          "a",
          "b",
          "c",
          "d",
          "e",
        ]
      `);
      expect(matcher.getReachableRoles('b')).toMatchInlineSnapshot(`
        Array [
          "b",
          "d",
          "e",
        ]
      `);
    });

    it('matches all with single required role.', () => {
      expect(matcher.match('e', 'a')).toMatchInlineSnapshot(`
              Object {
                "all": true,
                "any": true,
                "granted": Array [
                  "a",
                ],
                "matches": Array [
                  "e",
                ],
                "reachable": Array [
                  "a",
                  "b",
                  "c",
                  "d",
                  "e",
                ],
                "required": Array [
                  "e",
                ],
              }
          `);
    });

    it('matches none with single required role.', () => {
      expect(matcher.match('z', 'a')).toMatchInlineSnapshot(`
              Object {
                "all": false,
                "any": false,
                "granted": Array [
                  "a",
                ],
                "matches": Array [],
                "reachable": Array [
                  "a",
                  "b",
                  "c",
                  "d",
                  "e",
                ],
                "required": Array [
                  "z",
                ],
              }
          `);
    });

    it('matches all with single required role.', () => {
      expect(matcher.match(['e', 'b'], 'a')).toMatchInlineSnapshot(`
              Object {
                "all": true,
                "any": true,
                "granted": Array [
                  "a",
                ],
                "matches": Array [
                  "e",
                  "b",
                ],
                "reachable": Array [
                  "a",
                  "b",
                  "c",
                  "d",
                  "e",
                ],
                "required": Array [
                  "e",
                  "b",
                ],
              }
          `);
    });

    it('matches any with single required roles.', () => {
      expect(matcher.match(['e', 'b', 'k', 'y'], 'a')).toMatchInlineSnapshot(`
              Object {
                "all": false,
                "any": true,
                "granted": Array [
                  "a",
                ],
                "matches": Array [
                  "e",
                  "b",
                ],
                "reachable": Array [
                  "a",
                  "b",
                  "c",
                  "d",
                  "e",
                ],
                "required": Array [
                  "e",
                  "b",
                  "k",
                  "y",
                ],
              }
          `);
    });

    it('matches any outside the authority.', () => {
      expect(matcher.match(['k', 'z'], 'z')).toMatchInlineSnapshot(`
        Object {
          "all": false,
          "any": true,
          "granted": Array [
            "z",
          ],
          "matches": Array [
            "z",
          ],
          "reachable": Array [
            "z",
          ],
          "required": Array [
            "k",
            "z",
          ],
        }
      `);
    });

    it('matches any in and out the authority.', () => {
      expect(matcher.match(['d', 'k', 'z'], ['z', 'p', 'b']))
        .toMatchInlineSnapshot(`
        Object {
          "all": false,
          "any": true,
          "granted": Array [
            "z",
            "p",
            "b",
          ],
          "matches": Array [
            "d",
            "z",
          ],
          "reachable": Array [
            "b",
            "d",
            "e",
            "z",
            "p",
          ],
          "required": Array [
            "d",
            "k",
            "z",
          ],
        }
      `);
    });

    it('matches all with multiple required roles and multiple granted roles.', () => {
      expect(matcher.match(['e', 'b'], ['c', 'b'])).toMatchInlineSnapshot(`
              Object {
                "all": true,
                "any": true,
                "granted": Array [
                  "c",
                  "b",
                ],
                "matches": Array [
                  "e",
                  "b",
                ],
                "reachable": Array [
                  "c",
                  "d",
                  "e",
                  "b",
                ],
                "required": Array [
                  "e",
                  "b",
                ],
              }
          `);
    });

    it('matches all with single required role and multiple granted roles.', () => {
      expect(matcher.match('e', ['c', 'b'])).toMatchInlineSnapshot(`
              Object {
                "all": true,
                "any": true,
                "granted": Array [
                  "c",
                  "b",
                ],
                "matches": Array [
                  "e",
                ],
                "reachable": Array [
                  "c",
                  "d",
                  "e",
                  "b",
                ],
                "required": Array [
                  "e",
                ],
              }
          `);
    });

    it('matches any with multiple required role and multiple granted roles.', () => {
      expect(matcher.match(['e', 'z'], ['c', 'b'])).toMatchInlineSnapshot(`
              Object {
                "all": false,
                "any": true,
                "granted": Array [
                  "c",
                  "b",
                ],
                "matches": Array [
                  "e",
                ],
                "reachable": Array [
                  "c",
                  "d",
                  "e",
                  "b",
                ],
                "required": Array [
                  "e",
                  "z",
                ],
              }
          `);
    });

    it('matches none with multiple required role and multiple granted roles.', () => {
      expect(matcher.match(['k', 'z'], ['c', 'b'])).toMatchInlineSnapshot(`
              Object {
                "all": false,
                "any": false,
                "granted": Array [
                  "c",
                  "b",
                ],
                "matches": Array [],
                "reachable": Array [
                  "c",
                  "d",
                  "e",
                  "b",
                ],
                "required": Array [
                  "k",
                  "z",
                ],
              }
          `);
    });

    it('matches none with single required role and multiple granted roles.', () => {
      expect(matcher.match('k', ['c', 'b'])).toMatchInlineSnapshot(`
              Object {
                "all": false,
                "any": false,
                "granted": Array [
                  "c",
                  "b",
                ],
                "matches": Array [],
                "reachable": Array [
                  "c",
                  "d",
                  "e",
                  "b",
                ],
                "required": Array [
                  "k",
                ],
              }
          `);
    });

    it('matches none when granted roles is an empty array.', () => {
      expect(matcher.match('k', [])).toMatchInlineSnapshot(`
              Object {
                "all": false,
                "any": false,
                "granted": Array [],
                "matches": Array [],
                "reachable": Array [],
                "required": Array [
                  "k",
                ],
              }
          `);
    });

    it('matches none when granted roles is an empty array.', () => {
      expect(matcher.match([], ['c', 'b'])).toMatchInlineSnapshot(`
              Object {
                "all": false,
                "any": false,
                "granted": Array [
                  "c",
                  "b",
                ],
                "matches": Array [],
                "reachable": Array [
                  "c",
                  "d",
                  "e",
                  "b",
                ],
                "required": Array [],
              }
          `);
    });

    it('matches none when both required and granted are empty arrays.', () => {
      expect(matcher.match([], [])).toMatchInlineSnapshot(`
              Object {
                "all": false,
                "any": false,
                "granted": Array [],
                "matches": Array [],
                "reachable": Array [],
                "required": Array [],
              }
          `);
    });

    it('matches none when granted is an undefined value.', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(matcher.match(['a', 'b'], undefined as any))
        .toMatchInlineSnapshot(`
              Object {
                "all": false,
                "any": false,
                "granted": Array [],
                "matches": Array [],
                "reachable": Array [],
                "required": Array [
                  "a",
                  "b",
                ],
              }
          `);
    });

    it('matches none when granted is an empty string.', () => {
      expect(matcher.match(['a', 'b'], '')).toMatchInlineSnapshot(`
              Object {
                "all": false,
                "any": false,
                "granted": Array [],
                "matches": Array [],
                "reachable": Array [],
                "required": Array [
                  "a",
                  "b",
                ],
              }
          `);
    });

    it('matches none when both required and granted are empty arrays.', () => {
      expect(matcher.match('k', ['c', 'b'])).toMatchInlineSnapshot(`
        Object {
          "all": false,
          "any": false,
          "granted": Array [
            "c",
            "b",
          ],
          "matches": Array [],
          "reachable": Array [
            "c",
            "d",
            "e",
            "b",
          ],
          "required": Array [
            "k",
          ],
        }
      `);
    });
  });
});
