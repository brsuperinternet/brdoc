import { ActionIcon } from "@mantine/core";
import { IconChevronRight, IconFileDescription } from "@tabler/icons-react";
import { KeyboardEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { getPageTitle } from "@/features/page/page.utils";
import { IPage } from "@/features/page/types/page.types";
import classes from "./destination-picker.module.css";
import { PageChildren } from "./page-children";

type PageRowProps = {
  page: Partial<IPage>;
  depth: number;
  limit: number;
  selectedId: string | null;
  excludePageId?: string;
  onSelect: (page: Partial<IPage>) => void;
};

export function PageRow({
  page,
  depth,
  limit,
  selectedId,
  excludePageId,
  onSelect,
}: PageRowProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const isExcluded = page.id === excludePageId;
  const isSelected = page.id === selectedId;

  const rowClasses = [
    classes.pageRow,
    isSelected && classes.selected,
    isExcluded && classes.disabled,
  ]
    .filter(Boolean)
    .join(" ");

  const handleSelect = () => {
    if (!isExcluded) {
      onSelect(page);
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

  return (
    <>
      <div
        aria-disabled={isExcluded || undefined}
        className={rowClasses}
        onClick={handleSelect}
        onKeyDown={handleRowKeyDown}
        role="button"
        style={{ paddingLeft: depth * 20 + 12 }}
        tabIndex={isExcluded ? -1 : 0}
      >
        {page.hasChildren ? (
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

        <div className={classes.iconWrapper}>
          {page.icon ? (
            page.icon
          ) : (
            <ActionIcon
              c="gray"
              component="div"
              size={22}
              variant="transparent"
            >
              <IconFileDescription size={18} />
            </ActionIcon>
          )}
        </div>

        <div className={classes.pageTitle}>
          {getPageTitle(page.title, page.isBase, t)}
        </div>
      </div>

      {expanded && page.hasChildren && (
        <PageChildren
          depth={depth + 1}
          excludePageId={excludePageId}
          limit={limit}
          onSelectPage={onSelect}
          pageId={page.id}
          selectedId={selectedId}
          spaceId={page.spaceId}
        />
      )}
    </>
  );
}
