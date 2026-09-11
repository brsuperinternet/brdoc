// Server-side public surface: everything in client + evaluator + registry.
export * from "./ast";
export * from "./error";
export * from "./format";
export * from "./parser";
export * from "./resolver";
export * from "./tokenizer";
export * from "./typecheck";
export * from "./types";

import "./functions/index"; // side-effect: populate registry

export * from "./eval";
export type { FormulaFn } from "./functions/index";
export { register, registry } from "./functions/index";
export * from "./graph";
export * from "./number";
