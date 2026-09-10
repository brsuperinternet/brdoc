import { MantineSize, Switch, Text } from "@mantine/core";
import { useAtom } from "jotai/index";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ResponsiveSettingsContent,
  ResponsiveSettingsControl,
  ResponsiveSettingsRow,
} from "@/components/ui/responsive-settings-row";
import { userAtom } from "@/features/user/atoms/current-user-atom.ts";
import { updateUser } from "@/features/user/services/user-service.ts";

export default function PageWidthPref() {
  const { t } = useTranslation();

  return (
    <ResponsiveSettingsRow>
      <ResponsiveSettingsContent>
        <Text size="md">{t("Full page width")}</Text>
        <Text c="dimmed" size="sm">
          {t("Choose your preferred page width.")}
        </Text>
      </ResponsiveSettingsContent>

      <ResponsiveSettingsControl>
        <PageWidthToggle />
      </ResponsiveSettingsControl>
    </ResponsiveSettingsRow>
  );
}

interface PageWidthToggleProps {
  label?: string;
  size?: MantineSize;
}

export function PageWidthToggle({ size, label }: PageWidthToggleProps) {
  const { t } = useTranslation();
  const [user, setUser] = useAtom(userAtom);
  const [checked, setChecked] = useState(
    user.settings?.preferences?.fullPageWidth
  );

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.currentTarget.checked;
    setChecked(value);
    try {
      const updatedUser = await updateUser({ fullPageWidth: value });
      setUser(updatedUser);
    } catch {
      setChecked(!value);
    }
  };

  return (
    <Switch
      aria-label={t("Toggle full page width")}
      defaultChecked={checked}
      label={label}
      labelPosition="left"
      onChange={handleChange}
      size={size}
    />
  );
}
