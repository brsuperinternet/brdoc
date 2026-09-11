import type { FormulaAST, RawFormulaAST } from "./ast";
import { FormulaParseError } from "./error";

export type ResolveResult = {
  ast: FormulaAST;
  dependencies: string[];
};

export function resolve(
  raw: RawFormulaAST,
  nameToId: ReadonlyMap<string, string>
): ResolveResult {
  const deps = new Set<string>();
  const ast = walk(raw, nameToId, deps);
  return { ast, dependencies: Array.from(deps).sort() };
}

function walk(
  node: RawFormulaAST,
  nameToId: ReadonlyMap<string, string>,
  deps: Set<string>
): FormulaAST {
  switch (node.t) {
    case "num":
    case "str":
    case "bool":
    case "null":
      return node as FormulaAST;
    case "propName": {
      const id = nameToId.get(node.name);
      if (!id) {
        throw new FormulaParseError([
          {
            code: "UNKNOWN_PROPERTY",
            message: `Unknown property '${node.name}'`,
            span: { end: 0, start: 0 }, // parser carries real spans; resolver is post-parse
          },
        ]);
      }
      deps.add(id);
      return { id, t: "prop" };
    }
    case "op":
      return {
        args: (node as any).args.map((a: RawFormulaAST) =>
          walk(a, nameToId, deps)
        ),
        op: (node as any).op,
        t: "op",
      };
    case "if":
      return {
        cond: walk((node as any).cond, nameToId, deps),
        else: walk((node as any).else, nameToId, deps),
        t: "if",
        then: walk((node as any).then, nameToId, deps),
      };
    case "and":
      return {
        args: (node as any).args.map((a: RawFormulaAST) =>
          walk(a, nameToId, deps)
        ),
        t: "and",
      };
    case "or":
      return {
        args: (node as any).args.map((a: RawFormulaAST) =>
          walk(a, nameToId, deps)
        ),
        t: "or",
      };
    case "call":
      return {
        args: (node as any).args.map((a: RawFormulaAST) =>
          walk(a, nameToId, deps)
        ),
        fn: (node as any).fn,
        t: "call",
      };
  }
}
