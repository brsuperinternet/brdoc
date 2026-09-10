import { ActionIcon, Badge, Tooltip } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconAdjustments,
  IconArrowsDiagonal,
  IconDownload,
  IconEye,
  IconFilter,
  IconLayoutColumns,
  IconSortAscending,
} from "@tabler/icons-react";
import { Table } from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { KanbanCardProperties } from "@/ee/base/components/kanban/kanban-card-properties";
import { KanbanGroupByPicker } from "@/ee/base/components/kanban/kanban-group-by-picker";
import { ViewFilterConfigPopover } from "@/ee/base/components/views/view-filter-config";
import { ViewPropertyVisibility } from "@/ee/base/components/views/view-property-visibility";
import { ViewSortConfigPopover } from "@/ee/base/components/views/view-sort-config";
import { ViewTabs } from "@/ee/base/components/views/view-tabs";
import { exportBaseToCsv } from "@/ee/base/services/base-service";
import toolbarClasses from "@/ee/base/styles/base-toolbar.module.css";
import classes from "@/ee/base/styles/grid.module.css";
import {
  FilterCondition,
  FilterGroup,
  IBase,
  IBaseRow,
  IBaseView,
  ViewSortConfig,
} from "@/ee/base/types/base.types";
import { getApiErrorMessage } from "@/lib/api-error";

type BaseToolbarProps = {
  base: IBase;
  activeView: IBaseView | undefined;
  views: IBaseView[];
  table?: Table<IBaseRow>;
  onViewChange: (viewId: string) => void;
  onAddView?: () => void;
  canAddView?: boolean;
  onPersistViewConfig: () => void;
  onDraftSortsChange: (sorts: ViewSortConfig[] | undefined) => void;
  onDraftFiltersChange: (filter: FilterGroup | undefined) => void;
  onExpand?: () => void;
  getViewShareUrl?: (viewId: string) => string | null;
};

export function BaseToolbar({
  base,
  activeView,
  views,
  table,
  onViewChange,
  onAddView,
  canAddView,
  onPersistViewConfig,
  onDraftSortsChange,
  onDraftFiltersChange,
  onExpand,
  getViewShareUrl,
}: BaseToolbarProps) {
  const { t } = useTranslation();
  const [sortOpened, setSortOpened] = useState(false);
  const [filterOpened, setFilterOpened] = useState(false);
  const [propertiesOpened, setPropertiesOpened] = useState(false);
  const [cardPropertiesOpened, setCardPropertiesOpened] = useState(false);
  const [exporting, setExporting] = useState(false);

  const isKanban = activeView?.type === "kanban";

  const handleExport = useCallback(async () => {
    if (exporting) {
      return;
    }
    setExporting(true);
    try {
      await exportBaseToCsv(base.id);
    } catch (err) {
      notifications.show({
        color: "red",
        message: getApiErrorMessage(err, t("Failed to export CSV")),
      });
    } finally {
      setExporting(false);
    }
  }, [base.id, exporting, t]);

  const openToolbar = useCallback((panel: "sort" | "filter" | "properties") => {
    setSortOpened(panel === "sort" ? (v) => !v : false);
    setFilterOpened(panel === "filter" ? (v) => !v : false);
    setPropertiesOpened(panel === "properties" ? (v) => !v : false);
  }, []);

  const sorts = activeView?.config?.sorts ?? [];
  const conditions = useMemo<FilterCondition[]>(() => {
    const filter = activeView?.config?.filter;
    if (!filter || filter.op !== "and") {
      return [];
    }
    return filter.children.filter(
      (c): c is FilterCondition => !("children" in c)
    );
  }, [activeView?.config?.filter]);

  const hiddenPropertyCount = useMemo(() => {
    if (!table) {
      return 0;
    }
    const cols = table
      .getAllLeafColumns()
      .filter((col) => col.id !== "__row_number");
    return cols.filter((col) => col.getCanHide() && !col.getIsVisible()).length;
  }, [table, table?.getState().columnVisibility]);

  const handleSortsChange = useCallback(
    (newSorts: ViewSortConfig[]) => {
      onDraftSortsChange(newSorts.length > 0 ? newSorts : undefined);
    },
    [onDraftSortsChange]
  );

  const handleFiltersChange = useCallback(
    (newConditions: FilterCondition[]) => {
      const filter: FilterGroup | undefined =
        newConditions.length > 0
          ? { children: newConditions, op: "and" }
          : undefined;
      onDraftFiltersChange(filter);
    },
    [onDraftFiltersChange]
  );

  return (
    <div className={classes.toolbar}>
      <ViewTabs
        activeViewId={activeView?.id}
        base={base}
        canAddView={canAddView}
        getViewShareUrl={getViewShareUrl}
        onAddView={onAddView}
        onViewChange={onViewChange}
        pageId={base.id}
        views={views}
      />

      <div className={classes.toolbarRight}>
        <Tooltip label={t("Export CSV")}>
          <ActionIcon
            color="gray"
            loading={exporting}
            onClick={handleExport}
            size="sm"
            variant="subtle"
          >
            <IconDownload size={16} />
          </ActionIcon>
        </Tooltip>

        <ViewFilterConfigPopover
          conditions={conditions}
          onChange={handleFiltersChange}
          onClose={() => setFilterOpened(false)}
          opened={filterOpened}
          properties={base.properties}
        >
          <Tooltip label={t("Filter")}>
            <ActionIcon
              color={conditions.length > 0 ? "blue" : "gray"}
              onClick={() => openToolbar("filter")}
              size="sm"
              variant="subtle"
            >
              <IconFilter size={16} />
              {conditions.length > 0 && (
                <Badge
                  circle
                  className={toolbarClasses.badgeDot}
                  color="blue"
                  size="xs"
                >
                  {conditions.length}
                </Badge>
              )}
            </ActionIcon>
          </Tooltip>
        </ViewFilterConfigPopover>

        {isKanban && activeView && (
          <>
            <KanbanGroupByPicker base={base} pageId={base.id} view={activeView}>
              <Tooltip label={t("Group by")}>
                <ActionIcon color="gray" size="sm" variant="subtle">
                  <IconLayoutColumns size={16} />
                </ActionIcon>
              </Tooltip>
            </KanbanGroupByPicker>

            <KanbanCardProperties
              base={base}
              onClose={() => setCardPropertiesOpened(false)}
              opened={cardPropertiesOpened}
              pageId={base.id}
              view={activeView}
            >
              <Tooltip label={t("Card properties")}>
                <ActionIcon
                  color="gray"
                  onClick={() => setCardPropertiesOpened((v) => !v)}
                  size="sm"
                  variant="subtle"
                >
                  <IconAdjustments size={16} />
                </ActionIcon>
              </Tooltip>
            </KanbanCardProperties>
          </>
        )}

        {!isKanban && (
          <>
            <ViewSortConfigPopover
              onChange={handleSortsChange}
              onClose={() => setSortOpened(false)}
              opened={sortOpened}
              properties={base.properties}
              sorts={sorts}
            >
              <Tooltip label={t("Sort")}>
                <ActionIcon
                  color={sorts.length > 0 ? "blue" : "gray"}
                  onClick={() => openToolbar("sort")}
                  size="sm"
                  variant="subtle"
                >
                  <IconSortAscending size={16} />
                  {sorts.length > 0 && (
                    <Badge
                      circle
                      className={toolbarClasses.badgeDot}
                      color="blue"
                      size="xs"
                    >
                      {sorts.length}
                    </Badge>
                  )}
                </ActionIcon>
              </Tooltip>
            </ViewSortConfigPopover>

            {table && (
              <ViewPropertyVisibility
                onClose={() => setPropertiesOpened(false)}
                onPersist={onPersistViewConfig}
                opened={propertiesOpened}
                properties={base.properties}
                table={table}
              >
                <Tooltip label={t("Hide properties")}>
                  <ActionIcon
                    color={hiddenPropertyCount > 0 ? "blue" : "gray"}
                    onClick={() => openToolbar("properties")}
                    size="sm"
                    variant="subtle"
                  >
                    <IconEye size={16} />
                    {hiddenPropertyCount > 0 && (
                      <Badge
                        circle
                        className={toolbarClasses.badgeDot}
                        color="blue"
                        size="xs"
                      >
                        {hiddenPropertyCount}
                      </Badge>
                    )}
                  </ActionIcon>
                </Tooltip>
              </ViewPropertyVisibility>
            )}
          </>
        )}

        {onExpand && (
          <Tooltip label={t("Open as page")}>
            <ActionIcon
              color="gray"
              onClick={onExpand}
              size="sm"
              variant="subtle"
            >
              <IconArrowsDiagonal size={16} />
            </ActionIcon>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
