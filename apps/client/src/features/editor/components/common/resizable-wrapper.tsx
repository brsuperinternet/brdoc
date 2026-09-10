import clsx from "clsx";
import React, {
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import classes from "./resizable-wrapper.module.css";

type Handle = "tl" | "tr" | "bl" | "br" | "bottom";

const HANDLE_SIGN: Record<Handle, { x: number; y: number }> = {
  bl: { x: -1, y: 1 },
  bottom: { x: 0, y: 1 },
  br: { x: 1, y: 1 },
  tl: { x: -1, y: -1 },
  tr: { x: 1, y: -1 },
};

const HANDLE_CURSOR: Record<Handle, string> = {
  bl: "nesw-resize",
  bottom: "ns-resize",
  br: "nwse-resize",
  tl: "nwse-resize",
  tr: "nesw-resize",
};

const CORNER_CLASSES: Record<string, string> = {
  bl: classes.cornerHandleBL,
  br: classes.cornerHandleBR,
  tl: classes.cornerHandleTL,
  tr: classes.cornerHandleTR,
};

interface ResizableWrapperProps {
  children: ReactNode;
  className?: string;
  initialHeight?: number;
  initialWidth?: number;
  isEditable?: boolean;
  maxHeight?: number;
  maxWidth?: number;
  minHeight?: number;
  minWidth?: number;
  onResize?: (width: number, height: number) => void;
  selected?: boolean;
}

type DragState = {
  handle: Handle;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
};

export const ResizableWrapper: React.FC<ResizableWrapperProps> = ({
  children,
  initialWidth = 640,
  initialHeight = 480,
  minWidth = 200,
  maxWidth = 1200,
  minHeight = 200,
  maxHeight = 1200,
  onResize,
  isEditable = true,
  className,
  selected = false,
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const dragRef = useRef<DragState | null>(null);
  const widthRef = useRef(initialWidth);
  const heightRef = useRef(initialHeight);
  const onResizeRef = useRef(onResize);
  onResizeRef.current = onResize;
  const constraintsRef = useRef({ maxHeight, maxWidth, minHeight, minWidth });
  constraintsRef.current = { maxHeight, maxWidth, minHeight, minWidth };

  useEffect(() => {
    if (!dragRef.current && wrapperRef.current) {
      widthRef.current = initialWidth;
      heightRef.current = initialHeight;
      wrapperRef.current.style.width = `${initialWidth}px`;
      wrapperRef.current.style.height = `${initialHeight}px`;
    }
  }, [initialWidth, initialHeight]);

  const handleMouseMove = useRef((e: MouseEvent) => {
    const drag = dragRef.current;
    if (!(drag && wrapperRef.current)) {
      return;
    }

    const sign = HANDLE_SIGN[drag.handle];
    const { minWidth, maxWidth, minHeight, maxHeight } = constraintsRef.current;

    const deltaY = e.clientY - drag.startY;
    const newHeight = Math.min(
      Math.max(drag.startHeight + deltaY * sign.y, minHeight),
      maxHeight
    );
    heightRef.current = newHeight;
    wrapperRef.current.style.height = `${newHeight}px`;

    if (sign.x !== 0) {
      const deltaX = e.clientX - drag.startX;
      const newWidth = Math.min(
        Math.max(drag.startWidth + deltaX * sign.x, minWidth),
        maxWidth
      );
      widthRef.current = newWidth;
      wrapperRef.current.style.width = `${newWidth}px`;
    }
  }).current;

  const handleMouseUp = useRef(() => {
    dragRef.current = null;
    setIsResizing(false);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    onResizeRef.current?.(widthRef.current, heightRef.current);
  }).current;

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, handle: Handle) => {
      e.preventDefault();
      e.stopPropagation();
      dragRef.current = {
        handle,
        startHeight: heightRef.current,
        startWidth: widthRef.current,
        startX: e.clientX,
        startY: e.clientY,
      };
      setIsResizing(true);
      document.body.style.cursor = HANDLE_CURSOR[handle];
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [handleMouseMove, handleMouseUp]
  );

  useEffect(
    () => () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    },
    [handleMouseMove, handleMouseUp]
  );

  const shouldShowHandles = isEditable && (isHovered || isResizing || selected);

  return (
    <div
      className={clsx(classes.wrapper, className, {
        [classes.resizing]: isResizing,
      })}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      ref={wrapperRef}
      style={{ height: heightRef.current, width: widthRef.current }}
    >
      {children}
      {isResizing && <div className={classes.overlay} />}
      {shouldShowHandles && (
        <>
          {(["tl", "tr", "bl", "br"] as const).map((corner) => (
            <div
              className={clsx(classes.cornerHandle, CORNER_CLASSES[corner])}
              key={corner}
              onMouseDown={(e) => handleResizeStart(e, corner)}
            />
          ))}
          <div
            className={classes.resizeHandleBottom}
            onMouseDown={(e) => handleResizeStart(e, "bottom")}
          >
            <div className={classes.resizeBar} />
          </div>
        </>
      )}
    </div>
  );
};
