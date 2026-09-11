import { register } from "./registry";

register({
  arity: { max: 1, min: 1 },
  category: "logic",
  doc: "Returns true if the value is null or empty string or an error.",
  eval: ([v]) =>
    v == null ||
    v === "" ||
    (typeof v === "object" && v !== null && "__err" in v),
  name: "empty",
  paramTypes: "any",
  returnType: "boolean",
});
