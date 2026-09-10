import { Badge, Group, Switch, Text } from "@mantine/core";
import { useAtom } from "jotai";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ResponsiveSettingsContent,
  ResponsiveSettingsControl,
  ResponsiveSettingsRow,
} from "@/components/ui/responsive-settings-row";
import { userAtom } from "@/features/user/atoms/current-user-atom";
import { updateUser } from "@/features/user/services/user-service";

export default function FixedToolbarPref() {
  const { t } = useTranslation();
  const [user, setUser] = useAtom(userAtom);
  const [checked, setChecked] = useState(
    user.settings?.preferences?.editorToolbar ?? false
  );

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.currentTarget.checked;
    setChecked(value);
    try {
      const updatedUser = await updateUser({ editorToolbar: value });
      setUser(updatedUser);
    } catch {
      setChecked(!value);
    }
  };

  return (
    <ResponsiveSettingsRow>
      <ResponsiveSettingsContent>
        <Group gap="xs">
          <Text size="md">{t("Fixed editor toolbar")}</Text>
          <Badge color="gray" size="xs" variant="light">
            {t("Experimental")}
          </Badge>
        </Group>
        <Text c="dimmed" size="sm">
          {t(
            "Show a formatting toolbar above the editor with quick access to common actions."
          )}
        </Text>
      </ResponsiveSettingsContent>

      <ResponsiveSettingsControl>
        <Switch
          aria-label={t("Toggle fixed editor toolbar")}
          defaultChecked={checked}
          labelPosition="left"
          onChange={handleChange}
        />
      </ResponsiveSettingsControl>
    </ResponsiveSettingsRow>
  );
}
