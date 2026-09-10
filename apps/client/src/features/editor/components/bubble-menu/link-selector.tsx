import { ActionIcon, Tooltip } from "@mantine/core";
import { IconLink } from "@tabler/icons-react";
import { useSetAtom } from "jotai";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import { showLinkMenuAtom } from "@/features/editor/atoms/editor-atoms";

export const LinkSelector: FC = () => {
  const { t } = useTranslation();
  const setShowLinkMenu = useSetAtom(showLinkMenuAtom);

  return (
    <Tooltip label={t("Add link")} withArrow withinPortal={false}>
      <ActionIcon
        onClick={() => setShowLinkMenu(true)}
        radius="0"
        size="lg"
        style={{ border: "none" }}
        variant="default"
      >
        <IconLink size={16} />
      </ActionIcon>
    </Tooltip>
  );
};
