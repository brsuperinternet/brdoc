import { ActionIcon, MantineColor, MantineSize, Tooltip } from "@mantine/core";
import { IconCheck, IconCopy } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { CopyButton } from "@/components/common/copy-button";

interface CopyProps {
  color?: MantineColor;
  /** Override the accessible name (and tooltip) when not yet copied. Lets callers disambiguate adjacent copy buttons for screen readers. */
  label?: string;
  size?: MantineSize;
  text: string;
}
export default function CopyTextButton({ text, size, label }: CopyProps) {
  const { t } = useTranslation();

  const copyLabel = label ?? t("Copy");

  return (
    <CopyButton timeout={2000} value={text}>
      {({ copied, copy }) => (
        <Tooltip
          label={copied ? t("Copied") : copyLabel}
          position="right"
          withArrow
        >
          <ActionIcon
            aria-label={copied ? t("Copied") : copyLabel}
            color={copied ? "teal" : "gray"}
            onClick={copy}
            size={size}
            variant="subtle"
          >
            {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
          </ActionIcon>
        </Tooltip>
      )}
    </CopyButton>
  );
}
