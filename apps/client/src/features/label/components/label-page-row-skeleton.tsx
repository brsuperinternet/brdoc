import { Skeleton } from "@mantine/core";
import classes from "@/features/label/label.module.css";

type LabelPageRowSkeletonProps = {
  titleWidth?: number;
  metaWidth?: number;
};

export function LabelPageRowSkeleton({
  titleWidth = 220,
  metaWidth = 180,
}: LabelPageRowSkeletonProps) {
  return (
    <div aria-hidden="true" className={classes.row}>
      <div className={classes.rowMain}>
        <div className={classes.rowIcon}>
          <Skeleton height={18} radius="sm" width={18} />
        </div>
        <div className={classes.rowBody}>
          <Skeleton height={15} radius="xs" width={titleWidth} />
          <div className={classes.rowMeta}>
            <Skeleton height={18} radius="sm" width={18} />
            <Skeleton height={12} radius="xs" width={metaWidth} />
          </div>
        </div>
      </div>
    </div>
  );
}
