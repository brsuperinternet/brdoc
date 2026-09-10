import { MantineSize, SegmentedControl, Text } from "@mantine/core";
import { useAtom } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ResponsiveSettingsContent,
  ResponsiveSettingsControl,
  ResponsiveSettingsRow,
} from "@/components/ui/responsive-settings-row";
import { currentPageEditModeAtom } from "@/features/editor/atoms/editor-atoms.ts";
import { userAtom } from "@/features/user/atoms/current-user-atom.ts";
import { updateUser } from "@/features/user/services/user-service.ts";
import { PageEditMode } from "@/features/user/types/user.types.ts";

export default function PageStatePref() {
  const { t } = useTranslation();

  return (
    <ResponsiveSettingsRow>
      <ResponsiveSettingsContent>
        <Text size="md">{t("Default page edit mode")}</Text>
        <Text c="dimmed" size="sm">
          {t("Choose your preferred page edit mode. Avoid accidental edits.")}
        </Text>
      </ResponsiveSettingsContent>

      <ResponsiveSettingsControl>
        <PageStateSegmentedControl />
      </ResponsiveSettingsControl>
    </ResponsiveSettingsRow>
  );
}

interface PageStateSegmentedControlProps {
  size?: MantineSize;
}

export function PageStateSegmentedControl({
  size,
}: PageStateSegmentedControlProps) {
  const { t } = useTranslation();
  const [user, setUser] = useAtom(userAtom);
  const pageEditMode =
    user?.settings?.preferences?.pageEditMode ?? PageEditMode.Edit;
  const [value, setValue] = useState(pageEditMode);

  const handleChange = useCallback(
    async (newValue: string) => {
      const prevValue = value;
      setValue(newValue);
      try {
        const updatedUser = await updateUser({ pageEditMode: newValue });
        setUser(updatedUser);
      } catch {
        setValue(prevValue);
      }
    },
    [value, setUser]
  );

  useEffect(() => {
    if (pageEditMode !== value) {
      setValue(pageEditMode);
    }
  }, [pageEditMode, value]);

  return (
    <SegmentedControl
      data={[
        { label: t("Edit"), value: PageEditMode.Edit },
        { label: t("Read"), value: PageEditMode.Read },
      ]}
      onChange={handleChange}
      size={size}
      value={value}
    />
  );
}

// Header variant: updates the current page's mode locally without persisting
// the preference to the server.
export function PageEditModeToggle({ size }: { size?: MantineSize }) {
  const { t } = useTranslation();
  const [currentPageEditMode, setCurrentPageEditMode] = useAtom(
    currentPageEditModeAtom
  );

  return (
    <SegmentedControl
      data={[
        { label: t("Edit"), value: PageEditMode.Edit },
        { label: t("Read"), value: PageEditMode.Read },
      ]}
      onChange={(v) => setCurrentPageEditMode(v as PageEditMode)}
      size={size}
      value={currentPageEditMode}
    />
  );
}
