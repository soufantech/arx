import { HierarchicalRoleAuthority } from '../hierarchical-role-authority';

describe('HierarchicalRoleAuthority', () => {
  describe('mapping', () => {
    it('detects a circular reference when a role is backreferenced directly in its own child nodes.', () => {
      const CHILD_NODES_CIRC_REF_1 = {
        '1': ['1', '2'],
      };

      const CHILD_NODES_CIRC_REF_2 = {
        '1': ['2', '1'],
        '2': ['3'],
      };

      expect(() => {
        new HierarchicalRoleAuthority(CHILD_NODES_CIRC_REF_1);
      }).toThrow(
        'Circular reference error: role [1] is backreferenced in path [1] > [1]',
      );

      expect(() => {
        new HierarchicalRoleAuthority(CHILD_NODES_CIRC_REF_2);
      }).toThrow(
        'Circular reference error: role [1] is backreferenced in path [1] > [1]',
      );
    });

    it('detects a circular reference when roles are mutually backreferenced.', () => {
      const MUTUAL_CIRC_REF_1 = {
        '1': ['2'],
        '2': ['1'],
      };

      const MUTUAL_CIRC_REF_2 = {
        '1': ['3', '2'],
        '2': ['4', '1'],
      };

      expect(() => {
        new HierarchicalRoleAuthority(MUTUAL_CIRC_REF_1);
      }).toThrow(
        'Circular reference error: role [1] is backreferenced in path [1] > 2 > [1]',
      );

      expect(() => {
        new HierarchicalRoleAuthority(MUTUAL_CIRC_REF_2);
      }).toThrow(
        'Circular reference error: role [1] is backreferenced in path [1] > 2 > [1]',
      );
    });

    it('detects a circular reference when a role is backreferenced deep in the graph.', () => {
      const DEEP_CIRC_REF = {
        '1': ['2', '3'],
        '2': ['3', '4'],
        '4': ['5'],
        '5': ['6', '7', '8'],
        '8': ['9', '2', '10'], // '2' is backreferenced.
      };

      expect(() => {
        new HierarchicalRoleAuthority(DEEP_CIRC_REF);
      }).toThrow(
        'Circular reference error: role [2] is backreferenced in path 1 > [2] > 4 > 5 > 8 > [2]',
      );
    });

    it('detects a circular reference when a role is backreferenced indirectly.', () => {
      const INDIRECT_CIRC_REF_1 = {
        '1': ['2'],
        '2': ['3'],
        '3': ['1'],
      };

      const INDIRECT_CIRC_REF_2 = {
        '1': ['2'],
        '2': ['3'],
        '3': ['4', '1'],
      };

      expect(() => {
        new HierarchicalRoleAuthority(INDIRECT_CIRC_REF_1);
      }).toThrow(
        'Circular reference error: role [1] is backreferenced in path [1] > 2 > 3 > [1]',
      );

      expect(() => {
        new HierarchicalRoleAuthority(INDIRECT_CIRC_REF_2);
      }).toThrow(
        'Circular reference error: role [1] is backreferenced in path [1] > 2 > 3 > [1]',
      );
    });

    it('maps a line-shaped directed acyclic graph.', () => {
      const LINE_DAG = {
        '1': ['2'],
        '2': ['3'],
        '3': ['4'],
        '4': ['5'],
      };

      const authority = new HierarchicalRoleAuthority(LINE_DAG);

      expect(authority.getMapping()).toMatchSnapshot();
    });

    it('maps a tree-shaped directed acyclic graph.', () => {
      const TREE_DAG = {
        '1': ['2', '3'],
        '2': ['4', '5'],
        '3': ['6', '7'],
        '7': ['8'],
      };

      expect(
        new HierarchicalRoleAuthority(TREE_DAG).getMapping(),
      ).toMatchSnapshot();
    });

    it('maps a diamond-shaped directed acyclic graph.', () => {
      const DIAMOND_DAG = {
        '1': ['2', '3'],
        '2': ['4'],
        '3': ['4'], // Both '2' and '3' reference '4'
      };

      expect(
        new HierarchicalRoleAuthority(DIAMOND_DAG).getMapping(),
      ).toMatchSnapshot();
    });

    it('maps a baloon-shaped directed acyclic graph.', () => {
      // a baloon is like a diamond, but with a line in its end.
      const BALOON_DAG = {
        '1': ['2', '3'],
        '2': ['4'],
        '3': ['4'],
        '4': ['5'], // <- a diamond doesn't have this line.
      };

      expect(
        new HierarchicalRoleAuthority(BALOON_DAG).getMapping(),
      ).toMatchSnapshot();
    });

    it('maps a stick-figure-shaped directed acyclic graph.', () => {
      const STICK_FIGURE_DAG = {
        '1': ['2', '3'],
        '2': ['4'],
        '3': ['4'],
        '4': ['5', '6', '7'],
        '7': ['8'],
        '8': ['9', '10'],
      };

      expect(
        new HierarchicalRoleAuthority(STICK_FIGURE_DAG).getMapping(),
      ).toMatchSnapshot();
    });

    it('maps DAGs containing redundant roles.', () => {
      const REDUNDANT_TREE_DAG = {
        '1': ['2', '3', '4', '5', '6', '7'],
        '2': ['4', '5', '8'],
        '3': ['6', '7'],
      };

      expect(
        new HierarchicalRoleAuthority(REDUNDANT_TREE_DAG).getMapping(),
      ).toMatchSnapshot();
    });

    it('maps DAGs containing empty role arrays.', () => {
      const EMPTY_RANKLINE_DAG_1 = {
        '1': [],
      };

      const EMPTY_RANKLINE_DAG_2 = {
        '1': [],
        '2': ['4'],
        '3': [],
      };

      expect(
        new HierarchicalRoleAuthority(EMPTY_RANKLINE_DAG_1).getMapping(),
      ).toMatchSnapshot();

      expect(
        new HierarchicalRoleAuthority(EMPTY_RANKLINE_DAG_2).getMapping(),
      ).toMatchSnapshot();
    });

    it('maps empty directed acyclic graphs.', () => {
      const EMPTY_DAG = {};

      expect(
        new HierarchicalRoleAuthority(EMPTY_DAG).getMapping(),
      ).toMatchSnapshot();
    });

    it('maps deeply nested directed acyclic graphs.', () => {
      // 3' is pointed by '1', '2' and '8' (even though 8 is referenced indirectly by '1's and '2's chain).
      const DEEPLY_NESTED_DAG = {
        '1': ['2', '3'],
        '2': ['3', '4'],
        '4': ['5'],
        '5': ['6', '7', '8'],
        '8': ['9', '3', '10'],
      };

      expect(
        new HierarchicalRoleAuthority(DEEPLY_NESTED_DAG).getMapping(),
      ).toMatchSnapshot();
    });

    it('maps a DAG containing different DAGs.', () => {
      // in this test we have tree trees:
      const TREE_DAG_1 = {
        '1': ['2', '3'],
        '2': ['4', '5'],
        '3': ['6'],
      };

      const TREE_DAG_2 = {
        A: ['B', 'C'],
        B: ['D', 'E'],
        C: ['F'],
      };

      const TREE_DAG_3 = {
        a: ['b', 'c'],
        b: ['d', 'e'],
        c: ['f'],
      };

      const MULTIPLE_TREE_DAG = {
        ...TREE_DAG_1,
        ...TREE_DAG_2,
        ...TREE_DAG_3,
      };

      expect(
        new HierarchicalRoleAuthority(MULTIPLE_TREE_DAG).getMapping(),
      ).toMatchSnapshot();
    });

    it('can remap the hierarchy.', () => {
      const HIERARCHY_ONE = {
        a: ['b', 'c'],
      };

      const HIERARCHY_TWO = {
        k: ['y', 'z'],
      };

      const roleAuth = new HierarchicalRoleAuthority(HIERARCHY_ONE);

      expect(roleAuth.getMapping()).toMatchSnapshot();

      roleAuth.setHierarchy(HIERARCHY_TWO);

      expect(roleAuth.getMapping()).toMatchSnapshot();
    });
  });
});
