import { formatDateDisplay } from "@/ee/base/components/cells/cell-date";
import { formatNumber } from "@/ee/base/components/cells/cell-number";

export { formatDateDisplay, formatNumber };

export function formatTimestamp(value: string | null | undefined): string {
  if (typeof value !== "string" || !value) {
    return "";
  }
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatLongTextPreview(
  value: string | null | undefined
): string {
  if (typeof value !== "string") {
    return "";
  }
  return value.replace(/\s+/g, " ").trim();
}
