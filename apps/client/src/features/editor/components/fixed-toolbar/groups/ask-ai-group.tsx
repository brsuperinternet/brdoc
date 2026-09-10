import { Button } from "@mantine/core";
import { IconSparkles } from "@tabler/icons-react";
import { useSetAtom } from "jotai";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import { showAiMenuAtom } from "@/features/editor/atoms/editor-atoms";

export const AskAiGroup: FC = () => {
  const { t } = useTranslation();
  const setShowAiMenu = useSetAtom(showAiMenuAtom);

  return (
    <Button
      color="dark"
      leftSection={<IconSparkles size={14} />}
      onClick={() => setShowAiMenu(true)}
      size="xs"
      variant="subtle"
    >
      {t("Ask AI")}
    </Button>
  );
};
