import { Tooltip } from "@mantine/core";
import { CSSProperties, useRef, useState } from "react";
import cellClasses from "@/ee/base/styles/cells.module.css";

type ChoiceBadgeProps = {
  name: string;
  style: CSSProperties;
};

export function ChoiceBadge({ name, style }: ChoiceBadgeProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [truncated, setTruncated] = useState(false);

  return (
    <Tooltip disabled={!truncated} label={name} openDelay={400} withinPortal>
      <span
        className={cellClasses.badge}
        onMouseEnter={() => {
          const el = ref.current;
          if (el) {
            setTruncated(el.scrollWidth > el.clientWidth);
          }
        }}
        ref={ref}
        style={style}
      >
        {name}
      </span>
    </Tooltip>
  );
}
