import { makeErrorCell } from "../error";
import type { Value } from "../types";
import { register } from "./registry";

const num = (v: unknown): number | null => (v == null ? null : Number(v));

register({
  arity: { max: 2, min: 1 },
  category: "math",
  doc: "Rounds to the nearest integer, or to `places` decimals if given.",
  eval: ([v, places]) => {
    const n = num(v);
    if (n == null) {
      return null;
    }
    const p = places == null ? 0 : Math.trunc(Number(places));
    const factor = 10 ** p;
    return Math.round(n * factor) / factor;
  },
  name: "round",
  paramTypes: ["number", "number"],
  returnType: "number",
});
register({
  arity: { max: 1, min: 1 },
  category: "math",
  doc: "Rounds down.",
  eval: ([v]) => {
    const n = num(v);
    return n == null ? null : Math.floor(n);
  },
  name: "floor",
  paramTypes: ["number"],
  returnType: "number",
});
register({
  arity: { max: 1, min: 1 },
  category: "math",
  doc: "Rounds up.",
  eval: ([v]) => {
    const n = num(v);
    return n == null ? null : Math.ceil(n);
  },
  name: "ceil",
  paramTypes: ["number"],
  returnType: "number",
});
register({
  arity: { max: 1, min: 1 },
  category: "math",
  doc: "Absolute value.",
  eval: ([v]) => {
    const n = num(v);
    return n == null ? null : Math.abs(n);
  },
  name: "abs",
  paramTypes: ["number"],
  returnType: "number",
});
register({
  arity: { max: null, min: 1 },
  category: "math",
  doc: "Minimum of the arguments.",
  eval: (args) => {
    const nums = args.map(num).filter((n): n is number => n != null);
    return nums.length ? Math.min(...nums) : null;
  },
  name: "min",
  paramTypes: "variadic-any",
  returnType: "number",
});
register({
  arity: { max: null, min: 1 },
  category: "math",
  doc: "Maximum of the arguments.",
  eval: (args) => {
    const nums = args.map(num).filter((n): n is number => n != null);
    return nums.length ? Math.max(...nums) : null;
  },
  name: "max",
  paramTypes: "variadic-any",
  returnType: "number",
});
register({
  arity: { max: 2, min: 2 },
  category: "math",
  doc: "Remainder after division.",
  eval: ([a, b]) => {
    const na = num(a),
      nb = num(b);
    if (na == null || nb == null) {
      return null;
    }
    if (nb === 0) {
      return makeErrorCell("DIV_BY_ZERO", "modulo by zero");
    }
    return na % nb;
  },
  name: "mod",
  paramTypes: ["number", "number"],
  returnType: "number",
});
register({
  arity: { max: 2, min: 2 },
  category: "math",
  doc: "Sum of two numbers.",
  eval: ([a, b]) => {
    const na = num(a),
      nb = num(b);
    return na == null || nb == null ? null : na + nb;
  },
  name: "add",
  paramTypes: ["number", "number"],
  returnType: "number",
});
register({
  arity: { max: 2, min: 2 },
  category: "math",
  doc: "Difference of two numbers.",
  eval: ([a, b]) => {
    const na = num(a),
      nb = num(b);
    return na == null || nb == null ? null : na - nb;
  },
  name: "subtract",
  paramTypes: ["number", "number"],
  returnType: "number",
});
register({
  arity: { max: 2, min: 2 },
  category: "math",
  doc: "Product of two numbers.",
  eval: ([a, b]) => {
    const na = num(a),
      nb = num(b);
    return na == null || nb == null ? null : na * nb;
  },
  name: "multiply",
  paramTypes: ["number", "number"],
  returnType: "number",
});
register({
  arity: { max: 2, min: 2 },
  category: "math",
  doc: "Quotient of two numbers.",
  eval: ([a, b]) => {
    const na = num(a),
      nb = num(b);
    if (na == null || nb == null) {
      return null;
    }
    if (nb === 0) {
      return makeErrorCell("DIV_BY_ZERO", "division by zero");
    }
    return na / nb;
  },
  name: "divide",
  paramTypes: ["number", "number"],
  returnType: "number",
});
register({
  arity: { max: 2, min: 2 },
  category: "math",
  doc: "Base raised to an exponent.",
  eval: ([a, b]) => {
    const na = num(a),
      nb = num(b);
    return na == null || nb == null ? null : na ** nb;
  },
  name: "pow",
  paramTypes: ["number", "number"],
  returnType: "number",
});
register({
  arity: { max: 1, min: 1 },
  category: "math",
  doc: "Positive square root.",
  eval: ([v]) => {
    const n = num(v);
    if (n == null) {
      return null;
    }
    if (n < 0) {
      return makeErrorCell("TYPE_MISMATCH", "sqrt of negative number");
    }
    return Math.sqrt(n);
  },
  name: "sqrt",
  paramTypes: ["number"],
  returnType: "number",
});
register({
  arity: { max: null, min: 1 },
  category: "math",
  doc: "Sum of the arguments.",
  eval: (args) => {
    // Null propagates as 0 so `sum(prop("A"), prop("B"))` still works when
    // some cells are empty — matches Airtable/Notion semantics.
    let total = 0;
    for (const v of args) {
      const n = num(v);
      if (n != null && Number.isFinite(n)) {
        total += n;
      }
    }
    return total;
  },
  name: "sum",
  paramTypes: "variadic-any",
  returnType: "number",
});
const meanEval = (args: Value[]): Value => {
  const nums: number[] = [];
  for (const v of args) {
    const n = num(v);
    if (n != null && Number.isFinite(n)) {
      nums.push(n);
    }
  }
  if (nums.length === 0) {
    return null;
  }
  return nums.reduce((a, b) => a + b, 0) / nums.length;
};
register({
  arity: { max: null, min: 1 },
  category: "math",
  doc: "Arithmetic average of the arguments.",
  eval: meanEval,
  name: "mean",
  paramTypes: "variadic-any",
  returnType: "number",
});
register({
  arity: { max: null, min: 1 },
  category: "math",
  doc: "Arithmetic average of the arguments (alias of mean).",
  eval: meanEval,
  name: "average",
  paramTypes: "variadic-any",
  returnType: "number",
});
register({
  arity: { max: null, min: 1 },
  category: "math",
  doc: "Middle value of the arguments.",
  eval: (args) => {
    const nums: number[] = [];
    for (const v of args) {
      const n = num(v);
      if (n != null && Number.isFinite(n)) {
        nums.push(n);
      }
    }
    if (nums.length === 0) {
      return null;
    }
    nums.sort((a, b) => a - b);
    const mid = Math.floor(nums.length / 2);
    return nums.length % 2 === 0 ? (nums[mid - 1] + nums[mid]) / 2 : nums[mid];
  },
  name: "median",
  paramTypes: "variadic-any",
  returnType: "number",
});
