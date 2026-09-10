import { snapNumber } from "@docmost/base-formula/client";
import { AutoTooltipText } from "@/components/ui/auto-tooltip-text";
import { formatCurrency } from "@/ee/base/constants/currencies";
import { useEditableTextCell } from "@/ee/base/hooks/use-editable-text-cell";
import cellClasses from "@/ee/base/styles/cells.module.css";
import { IBaseProperty, NumberTypeOptions } from "@/ee/base/types/base.types";

type CellNumberProps = {
  value: unknown;
  property: IBaseProperty;
  rowId: string;
  isEditing: boolean;
  onCommit: (value: unknown) => void;
  onCancel: () => void;
};

const SEPARATOR_CHARS: Record<string, { group: string; decimal: string }> = {
  comma_period: { decimal: ".", group: "," },
  period_comma: { decimal: ",", group: "." },
  space_comma: { decimal: ",", group: " " },
  space_period: { decimal: ".", group: " " },
};

function separatorChars(style: string): { group: string; decimal: string } {
  if (style === "local") {
    const parts = new Intl.NumberFormat().formatToParts(11_111.1);
    return {
      decimal: parts.find((p) => p.type === "decimal")?.value ?? ".",
      group: parts.find((p) => p.type === "group")?.value ?? ",",
    };
  }
  return SEPARATOR_CHARS[style] ?? { decimal: ".", group: "," };
}

function formatPlain(
  value: number,
  precision: number | undefined,
  style: string
): string {
  const fixed = precision == null ? String(value) : value.toFixed(precision);
  if (style === "none") {
    return fixed;
  }
  const { group, decimal } = separatorChars(style);
  const neg = fixed[0] === "-";
  const abs = neg ? fixed.slice(1) : fixed;
  const dot = abs.indexOf(".");
  const intPart = dot === -1 ? abs : abs.slice(0, dot);
  const fracPart = dot === -1 ? "" : abs.slice(dot + 1);
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, group);
  const out = fracPart ? `${grouped}${decimal}${fracPart}` : grouped;
  return neg ? `-${out}` : out;
}

export function formatNumber(
  val: number | null | undefined,
  options: NumberTypeOptions | undefined
): string {
  if (val == null) {
    return "";
  }
  const precision = options?.precision;
  const format = options?.format ?? "plain";
  const style = options?.separators ?? "none";
  const v = precision == null ? snapNumber(val) : val;

  switch (format) {
    case "currency":
      return formatCurrency(v, options?.currencyCode, precision);
    case "percent":
      return `${formatPlain(v, precision, style)}%`;
    case "progress":
      return `${Math.min(100, Math.max(0, v)).toFixed(0)}%`;
    default:
      return formatPlain(v, precision, style);
  }
}

const toDraft = (value: unknown) =>
  typeof value === "number" ? String(value) : "";

export function sanitizeNumberInput(text: string): string {
  return text.replace(/[^0-9.-]/g, "");
}

export function parseNumberDraft(draft: string): number | null {
  const cleaned = sanitizeNumberInput(draft);
  if (cleaned === "" || cleaned === "-") {
    return null;
  }
  const parsed = Number(cleaned);
  return isNaN(parsed) ? null : parsed;
}

export function CellNumber({
  value,
  property,
  rowId,
  isEditing,
  onCommit,
  onCancel,
}: CellNumberProps) {
  const typeOptions = property.typeOptions as NumberTypeOptions | undefined;
  const { draft, setDraft, inputRef, handleKeyDown, handleBlur } =
    useEditableTextCell({
      isEditing,
      onCancel,
      onCommit,
      parse: parseNumberDraft,
      propertyId: property.id,
      rowId,
      toDraft,
      value,
    });

  if (isEditing) {
    return (
      <input
        className={`${cellClasses.cellInput} ${cellClasses.numberInput}`}
        inputMode="decimal"
        onBlur={handleBlur}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "" || v === "-" || /^-?\d*\.?\d*$/.test(v)) {
            setDraft(v);
          }
        }}
        onKeyDown={handleKeyDown}
        onPaste={(e) => {
          e.preventDefault();
          const el = e.currentTarget;
          const start = el.selectionStart ?? draft.length;
          const end = el.selectionEnd ?? draft.length;
          setDraft(
            draft.slice(0, start) +
              sanitizeNumberInput(e.clipboardData.getData("text")) +
              draft.slice(end)
          );
        }}
        ref={inputRef}
        type="text"
        value={draft}
      />
    );
  }

  const numValue = typeof value === "number" ? value : null;
  if (numValue == null) {
    return <span className={cellClasses.emptyValue} />;
  }

  return (
    <AutoTooltipText
      className={cellClasses.numberValue}
      fz="sm"
      tooltipProps={{ withinPortal: true }}
    >
      {formatNumber(numValue, typeOptions)}
    </AutoTooltipText>
  );
}
