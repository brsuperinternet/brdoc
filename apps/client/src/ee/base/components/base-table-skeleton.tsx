import { Skeleton } from "@mantine/core";
import classes from "@/ee/base/styles/base-table-skeleton.module.css";
import gridClasses from "@/ee/base/styles/grid.module.css";

const ROW_NUMBER_WIDTH = 64;
const COLUMN_WIDTH = 180;
const DEFAULT_COLUMN_COUNT = 6;
const DEFAULT_ROW_COUNT = 10;

// Deterministic widths prevent flicker between renders.
const CELL_WIDTH_RATIOS = [0.78, 0.62, 0.84, 0.55, 0.71, 0.66];
const HEADER_WIDTH_RATIOS = [0.42, 0.58, 0.5, 0.64, 0.46, 0.54];

type BaseTableSkeletonProps = {
  // Match the eventual content shape to avoid a jarring size jump on swap.
  rows?: number;
  columns?: number;
};

export function BaseTableSkeleton({
  rows = DEFAULT_ROW_COUNT,
  columns = DEFAULT_COLUMN_COUNT,
}: BaseTableSkeletonProps = {}) {
  const gridTemplateColumns = [
    `${ROW_NUMBER_WIDTH}px`,
    ...Array.from({ length: columns }, () => `${COLUMN_WIDTH}px`),
  ].join(" ");

  return (
    <div className={classes.root}>
      <div className={classes.toolbar}>
        <div className={classes.toolbarTabs}>
          <Skeleton height={22} radius="sm" width={44} />
          <Skeleton height={22} radius="sm" width={64} />
          <Skeleton height={22} radius="sm" width={48} />
        </div>
        <div className={classes.toolbarActions}>
          <Skeleton circle height={22} width={22} />
          <Skeleton circle height={22} width={22} />
          <Skeleton circle height={22} width={22} />
          <Skeleton circle height={22} width={22} />
        </div>
      </div>

      <div className={classes.gridWrapper}>
        <div className={classes.grid} style={{ gridTemplateColumns }}>
          <div className={gridClasses.headerCell}>
            <div className={classes.headerCellInner}>
              <Skeleton circle height={14} width={14} />
            </div>
          </div>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div className={gridClasses.headerCell} key={`h-${colIndex}`}>
              <div className={classes.headerCellInner}>
                <Skeleton circle height={14} width={14} />
                <Skeleton
                  height={10}
                  radius="sm"
                  width={`${HEADER_WIDTH_RATIOS[colIndex % HEADER_WIDTH_RATIOS.length] * 100}%`}
                />
              </div>
            </div>
          ))}

          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={`row-${rowIndex}`} style={{ display: "contents" }}>
              <div className={gridClasses.cell}>
                <div className={classes.cellInner}>
                  <Skeleton height={10} radius="sm" width={18} />
                </div>
              </div>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div
                  className={gridClasses.cell}
                  key={`cell-${rowIndex}-${colIndex}`}
                >
                  <div className={classes.cellInner}>
                    <Skeleton
                      height={10}
                      radius="sm"
                      width={`${CELL_WIDTH_RATIOS[(rowIndex + colIndex) % CELL_WIDTH_RATIOS.length] * 100}%`}
                    />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
