import { Transition } from "@mantine/core";
import { IconTrash, IconX } from "@tabler/icons-react";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { useDeleteSelectedRows } from "@/ee/base/hooks/use-delete-selected-rows";
import { useRowSelection } from "@/ee/base/hooks/use-row-selection";
import classes from "@/ee/base/styles/grid.module.css";

type SelectionActionBarProps = {
  pageId: string;
};

export const SelectionActionBar = memo(function SelectionActionBar({
  pageId,
}: SelectionActionBarProps) {
  const { t } = useTranslation();
  const { selectionCount, clear } = useRowSelection(pageId);
  const { deleteSelected, isPending } = useDeleteSelectedRows(pageId);

  const isOpen = selectionCount > 0;

  return (
    <Transition duration={150} mounted={isOpen} transition="slide-up">
      {(styles) => (
        <div className={classes.selectionActionBarWrapper} style={styles}>
          <div className={classes.selectionActionBar} role="toolbar">
            <span className={classes.selectionActionBarCount}>
              {t("{{count}} selected", { count: selectionCount })}
            </span>
            <button
              className={classes.selectionActionBarDelete}
              disabled={isPending}
              onClick={() => void deleteSelected()}
              type="button"
            >
              <IconTrash size={14} />
              {t("Delete")}
            </button>
            <button
              aria-label={t("Clear selection")}
              className={classes.selectionActionBarClose}
              onClick={clear}
              type="button"
            >
              <IconX size={14} />
            </button>
          </div>
        </div>
      )}
    </Transition>
  );
});
