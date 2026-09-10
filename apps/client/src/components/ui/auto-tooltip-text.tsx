import { Text, TextProps, Tooltip } from "@mantine/core";
import { ReactNode, useRef, useState } from "react";

type AutoTooltipTextProps = TextProps & {
  children: ReactNode;
  tooltipLabel?: string;
  tooltipProps?: Omit<
    React.ComponentProps<typeof Tooltip>,
    "children" | "label"
  >;
};

export function AutoTooltipText({
  children,
  tooltipLabel,
  tooltipProps,
  ...textProps
}: AutoTooltipTextProps) {
  const textRef = useRef<HTMLParagraphElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  const handleMouseEnter = () => {
    const element = textRef.current;
    if (element) {
      setIsTruncated(element.scrollWidth > element.clientWidth);
    }
  };

  const label = tooltipLabel ?? (typeof children === "string" ? children : "");

  return (
    <Tooltip
      disabled={!(isTruncated && label)}
      label={label}
      multiline
      withArrow
      withinPortal={false}
      {...tooltipProps}
    >
      <Text
        onMouseEnter={handleMouseEnter}
        ref={textRef}
        truncate
        {...textProps}
      >
        {children}
      </Text>
    </Tooltip>
  );
}
