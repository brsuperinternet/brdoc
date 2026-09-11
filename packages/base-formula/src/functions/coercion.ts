import { valueToString } from "../number";
import { register } from "./registry";

register({
  arity: { max: 1, min: 1 },
  category: "coercion",
  doc: "Parses the value as a number, or null.",
  eval: ([v]) => {
    if (v == null) {
      return null;
    }
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  },
  name: "toNumber",
  paramTypes: "any",
  returnType: "number",
});
register({
  arity: { max: 1, min: 1 },
  category: "coercion",
  doc: "Converts the value to a string.",
  eval: ([v]) => valueToString(v),
  name: "toString",
  paramTypes: "any",
  returnType: "string",
});
