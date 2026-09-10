import { ActionIcon, Tooltip } from "@mantine/core";
import { IconChevronRight, IconLock } from "@tabler/icons-react";
import { KeyboardEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { CustomAvatar } from "@/components/ui/custom-avatar";
import { AvatarIconType } from "@/features/attachments/types/attachment.types";
import { IPage } from "@/features/page/types/page.types";
import { ISpace } from "@/features/space/types/space.types";
import { SpaceRole } from "@/lib/types";
import classes from "./destination-picker.module.css";
import { PageChildren } from "./page-children";

type SpaceRowProps = {
  space: ISpace;
  limit: number;
  selectedId: string | null;
  excludePageId?: string;
  onSelectSpace: (space: ISpace) => void;
  onSelectPage: (page: Partial<IPage>, space: ISpace) => void;
};

export function SpaceRow({
  space,
  limit,
  selectedId,
  excludePageId,
  onSelectSpace,
  onSelectPage,
}: SpaceRowProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const writable =
    !!space.membership?.role && space.membership.role !== SpaceRole.READER;
  const isSelected = space.id === selectedId;

  const rowClasses = [
    classes.spaceRow,
    isSelected && classes.selected,
    !writable && classes.disabled,
  ]
    .filter(Boolean)
    .join(" ");

  const handleSelect = () => {
    if (writable) {
      onSelectSpace(space);
    }
  };

  const handleRowKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) {
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleSelect();
    }
  };

  const rowContent = (
    <div
      aria-disabled={!writable || undefined}
      className={rowClasses}
      data-space-id={space.id}
      onClick={handleSelect}
      onKeyDown={handleRowKeyDown}
      role="button"
      tabIndex={writable ? 0 : -1}
    >
      {writable ? (
        <ActionIcon
          aria-expanded={expanded}
          aria-label={expanded ? t("Collapse") : t("Expand")}
          className={`${classes.chevron} ${expanded ? classes.chevronExpanded : ""}`}
          color="gray"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          size="sm"
          variant="subtle"
        >
          <IconChevronRight size={14} />
        </ActionIcon>
      ) : (
        <div style={{ flexShrink: 0, width: 20 }} />
      )}

      <CustomAvatar
        avatarUrl={space.logo}
        name={space.name}
        size={22}
        type={AvatarIconType.SPACE_ICON}
      />

      <div className={classes.pageTitle}>{space.name}</div>

      {!writable && <IconLock color="var(--mantine-color-gray-5)" size={14} />}
    </div>
  );

  return (
    <>
      {writable ? (
        rowContent
      ) : (
        <Tooltip
          label={t("You don't have permission to create pages here")}
          position="right"
          withArrow
        >
          <div>{rowContent}</div>
        </Tooltip>
      )}

      {expanded && writable && (
        <PageChildren
          depth={1}
          excludePageId={excludePageId}
          limit={limit}
          onSelectPage={(page) => onSelectPage(page, space)}
          selectedId={selectedId}
          spaceId={space.id}
        />
      )}
    </>
  );
}
