import { valueToString } from "../number";
import { register } from "./registry";

const s = (v: unknown): string => valueToString(v);

register({
  arity: { max: null, min: 1 },
  category: "string",
  doc: "Concatenates strings.",
  eval: (args) => args.map(s).join(""),
  name: "concat",
  paramTypes: "variadic-any",
  returnType: "string",
});
register({
  arity: { max: 1, min: 1 },
  category: "string",
  doc: "Length of a string.",
  eval: ([v]) => s(v).length,
  name: "length",
  paramTypes: ["string"],
  returnType: "number",
});
register({
  arity: { max: 2, min: 2 },
  category: "string",
  doc: "Returns true if the first string contains the second.",
  eval: ([a, b]) => s(a).includes(s(b)),
  name: "contains",
  paramTypes: ["string", "string"],
  returnType: "boolean",
});
register({
  arity: { max: 1, min: 1 },
  category: "string",
  doc: "Lowercases the string.",
  eval: ([v]) => s(v).toLowerCase(),
  name: "lower",
  paramTypes: ["string"],
  returnType: "string",
});
register({
  arity: { max: 1, min: 1 },
  category: "string",
  doc: "Uppercases the string.",
  eval: ([v]) => s(v).toUpperCase(),
  name: "upper",
  paramTypes: ["string"],
  returnType: "string",
});
register({
  arity: { max: 1, min: 1 },
  category: "string",
  doc: "Strips whitespace from both ends.",
  eval: ([v]) => s(v).trim(),
  name: "trim",
  paramTypes: ["string"],
  returnType: "string",
});
