import { Group, Tooltip } from "@mantine/core";
import { CustomAvatar } from "@/components/ui/custom-avatar";
import { useReferenceStore } from "@/ee/base/reference/reference-store";
import cellClasses from "@/ee/base/styles/cells.module.css";
import { IBaseProperty } from "@/ee/base/types/base.types";

type CellLastEditedByProps = {
  value: unknown;
  property: IBaseProperty;
  rowId: string;
  isEditing: boolean;
  onCommit: (value: unknown) => void;
  onCancel: () => void;
};

export function CellLastEditedBy({ value, property }: CellLastEditedByProps) {
  const userId = typeof value === "string" ? value : null;

  const store = useReferenceStore(property.pageId);
  const user = userId ? (store.users[userId] ?? null) : null;

  if (!userId) {
    return <span className={cellClasses.emptyValue} />;
  }

  const name = user?.name ?? userId.substring(0, 8);

  return (
    <Group gap={6} style={{ overflow: "hidden" }} wrap="nowrap">
      <CustomAvatar
        avatarUrl={user?.avatarUrl ?? ""}
        name={name}
        radius="xl"
        size={20}
      />
      <Tooltip disabled={!name} label={name} openDelay={400} withinPortal>
        <span className={cellClasses.lastEditedByName}>{name}</span>
      </Tooltip>
    </Group>
  );
}
