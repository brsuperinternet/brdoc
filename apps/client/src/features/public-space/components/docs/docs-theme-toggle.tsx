import {
  ActionIcon,
  Tooltip,
  useComputedColorScheme,
  useMantineColorScheme,
} from "@mantine/core";
import { IconMoon, IconSun } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import styles from "./docs.module.css";

export default function DocsThemeToggle() {
  const { t } = useTranslation();
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme("light");

  return (
    <Tooltip label={t("Toggle color scheme")} withArrow>
      <ActionIcon
        aria-label={t("Toggle color scheme")}
        className={styles.headerAction}
        onClick={() =>
          setColorScheme(computedColorScheme === "light" ? "dark" : "light")
        }
        size="md"
        variant="subtle"
      >
        {computedColorScheme === "light" ? (
          <IconMoon size={18} stroke={1.75} />
        ) : (
          <IconSun size={18} stroke={1.75} />
        )}
      </ActionIcon>
    </Tooltip>
  );
}
