import clsx from "clsx";
import { CustomAvatar } from "@/components/ui/custom-avatar";
import { BadgeOverflowList } from "@/ee/base/components/cells/badge-overflow";
import cellClasses from "@/ee/base/styles/cells.module.css";
import { UserRef } from "@/ee/base/types/base.types";

type PersonReadListProps = {
  personIds: string[];
  users: Record<string, UserRef>;
};

export function PersonReadList({ personIds, users }: PersonReadListProps) {
  const entries = personIds.map((id) => ({
    avatarUrl: users[id]?.avatarUrl ?? "",
    id,
    name: users[id]?.name ?? id.substring(0, 8),
  }));
  const chips = entries.map((entry) => (
    <span
      className={clsx(cellClasses.badge, cellClasses.personChip)}
      key={entry.id}
    >
      <CustomAvatar
        avatarUrl={entry.avatarUrl}
        name={entry.name}
        radius="xl"
        size={16}
        style={{ flexShrink: 0 }}
      />
      <span className={cellClasses.personChipName}>{entry.name}</span>
    </span>
  ));
  return (
    <BadgeOverflowList
      chips={chips}
      measureKey={entries.map((e) => `${e.id}:${e.name}`).join("|")}
      tooltipLabel={entries.map((e) => e.name).join(", ")}
    />
  );
}
