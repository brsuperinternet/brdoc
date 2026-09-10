import {
  ActionIcon,
  Tooltip,
  useComputedColorScheme,
  useMantineColorScheme,
} from "@mantine/core";
import { IconMoon, IconSun } from "@tabler/icons-react";
import classes from "./theme-toggle.module.css";

export function ThemeToggle() {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme();

  return (
    <Tooltip label="Toggle Color Scheme">
      <ActionIcon
        aria-label="Toggle color scheme"
        onClick={() => {
          setColorScheme(computedColorScheme === "light" ? "dark" : "light");
        }}
        variant="default"
      >
        <IconSun className={classes.light} size={18} stroke={1.5} />
        <IconMoon className={classes.dark} size={18} stroke={1.5} />
      </ActionIcon>
    </Tooltip>
  );
}
