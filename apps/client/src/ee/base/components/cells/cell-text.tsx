import { AutoTooltipText } from "@/components/ui/auto-tooltip-text";
import { useEditableTextCell } from "@/ee/base/hooks/use-editable-text-cell";
import cellClasses from "@/ee/base/styles/cells.module.css";
import gridClasses from "@/ee/base/styles/grid.module.css";
import { IBaseProperty } from "@/ee/base/types/base.types";

type CellTextProps = {
  value: unknown;
  property: IBaseProperty;
  rowId: string;
  isEditing: boolean;
  onCommit: (value: unknown) => void;
  onCancel: () => void;
};

const toDraft = (value: unknown) => (typeof value === "string" ? value : "");
const parse = (draft: string) => draft;

export function CellText({
  value,
  property,
  rowId,
  isEditing,
  onCommit,
  onCancel,
}: CellTextProps) {
  const { draft, setDraft, inputRef, handleKeyDown, handleBlur } =
    useEditableTextCell({
      isEditing,
      onCancel,
      onCommit,
      parse,
      propertyId: property.id,
      rowId,
      toDraft,
      value,
    });

  if (isEditing) {
    return (
      <input
        className={cellClasses.cellInput}
        maxLength={1000}
        onBlur={handleBlur}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        ref={inputRef}
        type="text"
        value={draft}
      />
    );
  }

  const displayValue = toDraft(value);
  if (!displayValue) {
    return <span className={cellClasses.emptyValue} />;
  }
  return (
    <AutoTooltipText
      className={gridClasses.cellContent}
      fz="sm"
      tooltipProps={{ withinPortal: true }}
    >
      {displayValue}
    </AutoTooltipText>
  );
}
