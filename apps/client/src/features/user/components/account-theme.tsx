import {
  Group,
  MantineColorScheme,
  Select,
  Text,
  useMantineColorScheme,
} from "@mantine/core";
import { useTranslation } from "react-i18next";

export default function AccountTheme() {
  const { t } = useTranslation();

  return (
    <Group gap="xl" justify="space-between" wrap="nowrap">
      <div>
        <Text size="md">{t("Theme")}</Text>
        <Text c="dimmed" size="sm">
          {t("Choose your preferred color scheme.")}
        </Text>
      </div>

      <ThemeSwitcher />
    </Group>
  );
}

function ThemeSwitcher() {
  const { t } = useTranslation();
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  const handleChange = (value: MantineColorScheme) => {
    setColorScheme(value);
  };

  return (
    <Select
      allowDeselect={false}
      checkIconPosition="right"
      data={[
        { label: t("Light"), value: "light" },
        { label: t("Dark"), value: "dark" },
        { label: t("System settings"), value: "auto" },
      ]}
      label={t("Select theme")}
      onChange={handleChange}
      value={colorScheme}
    />
  );
}
