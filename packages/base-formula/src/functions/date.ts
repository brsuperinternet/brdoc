import { makeErrorCell } from "../error";
import { register } from "./registry";

const toDate = (v: unknown): Date | null => {
  if (v == null) {
    return null;
  }
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? null : d;
};

register({
  arity: { max: 0, min: 0 },
  category: "date",
  doc: "Current timestamp.",
  eval: () => new Date().toISOString(),
  name: "now",
  paramTypes: [],
  returnType: "date",
});
register({
  arity: { max: 0, min: 0 },
  category: "date",
  doc: "Midnight UTC of today.",
  eval: () => {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    return d.toISOString();
  },
  name: "today",
  paramTypes: [],
  returnType: "date",
});
register({
  arity: { max: 3, min: 3 },
  category: "date",
  doc: "Adds a duration to a date. Units: days, hours, minutes, months, years.",
  eval: ([base, amt, unit]) => {
    const d = toDate(base);
    if (!d) {
      return makeErrorCell("DATE_INVALID", "invalid date");
    }
    const n = Number(amt);
    const u = String(unit);
    const r = new Date(d);
    if (u === "days") {
      r.setUTCDate(r.getUTCDate() + n);
    } else if (u === "hours") {
      r.setUTCHours(r.getUTCHours() + n);
    } else if (u === "minutes") {
      r.setUTCMinutes(r.getUTCMinutes() + n);
    } else if (u === "months") {
      r.setUTCMonth(r.getUTCMonth() + n);
    } else if (u === "years") {
      r.setUTCFullYear(r.getUTCFullYear() + n);
    } else {
      return makeErrorCell("TYPE_MISMATCH", `unknown unit ${u}`);
    }
    return r.toISOString();
  },
  name: "dateAdd",
  paramTypes: ["date", "number", "string"],
  returnType: "date",
});
register({
  arity: { max: 3, min: 3 },
  category: "date",
  doc: "Difference between two dates in a given unit.",
  eval: ([a, b, unit]) => {
    const da = toDate(a),
      db = toDate(b);
    if (!da || !db) {
      return makeErrorCell("DATE_INVALID", "invalid date");
    }
    const ms = db.getTime() - da.getTime();
    const u = String(unit);
    if (u === "days") {
      return Math.floor(ms / 86_400_000);
    }
    if (u === "hours") {
      return Math.floor(ms / 3_600_000);
    }
    if (u === "minutes") {
      return Math.floor(ms / 60_000);
    }
    return makeErrorCell("TYPE_MISMATCH", `unknown unit ${u}`);
  },
  name: "dateBetween",
  paramTypes: ["date", "date", "string"],
  returnType: "number",
});
