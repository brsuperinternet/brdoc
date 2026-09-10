import { Group, Select, Text } from "@mantine/core";
import { useAtom } from "jotai";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { userAtom } from "../atoms/current-user-atom";
import { updateUser } from "../services/user-service";

export default function AccountLanguage() {
  const { t } = useTranslation();

  return (
    <Group gap="xl" justify="space-between" wrap="nowrap">
      <div>
        <Text size="md">{t("Language")}</Text>
        <Text c="dimmed" size="sm">
          {t("Choose your preferred interface language.")}
        </Text>
      </div>
      <LanguageSwitcher />
    </Group>
  );
}

function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useAtom(userAtom);
  const [language, setLanguage] = useState(
    user?.locale === "en" ? "en-US" : user?.locale
  );

  const handleChange = async (value: string) => {
    const updatedUser = await updateUser({ locale: value });

    setLanguage(value);
    setUser(updatedUser);

    i18n.changeLanguage(value);
  };

  return (
    <Select
      allowDeselect={false}
      checkIconPosition="right"
      data={[
        { label: "English (US)", value: "en-US" },
        { label: "Español (Spanish)", value: "es-ES" },
        { label: "Deutsch (German)", value: "de-DE" },
        { label: "Français (French)", value: "fr-FR" },
        { label: "Dutch (Netherlands)", value: "nl-NL" },
        { label: "Português (Brasil)", value: "pt-BR" },
        { label: "Italiano (Italian)", value: "it-IT" },
        { label: "日本語 (Japanese)", value: "ja-JP" },
        { label: "한국어 (Korean)", value: "ko-KR" },
        { label: "Українська (Ukrainian)", value: "uk-UA" },
        { label: "Русский (Russian)", value: "ru-RU" },
        { label: "中文 (简体)", value: "zh-CN" },
      ]}
      label={t("Select language")}
      onChange={handleChange}
      value={language || "en-US"}
    />
  );
}
