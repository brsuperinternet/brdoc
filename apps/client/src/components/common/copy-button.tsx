// Source: https://github.com/mantinedev/mantine/blob/master/packages/@mantine/core/src/components/CopyButton/CopyButton.tsx - MIT
// modified to use the polyfilled clipboard api

import { useProps } from "@mantine/core";
import React from "react";
import { useClipboard } from "@/hooks/use-clipboard";

interface CopyButtonProps {
  /** Children callback, provides current status and copy function as an argument */
  children: (payload: { copied: boolean; copy: () => void }) => React.ReactNode;

  /** Copied status timeout in ms @default `1000` */
  timeout?: number;

  /** Value that is copied to the clipboard when the button is clicked */
  value: string;
}

const defaultProps = {
  timeout: 1000,
} satisfies Partial<CopyButtonProps>;

export function CopyButton(props: CopyButtonProps) {
  const { children, timeout, value, ...others } = useProps(
    "CopyButton",
    defaultProps,
    props
  );
  const clipboard = useClipboard({ timeout });
  const copy = () => clipboard.copy(value);
  return <>{children({ copied: clipboard.copied, copy, ...others })}</>;
}

CopyButton.displayName = "@mantine/core/CopyButton";
