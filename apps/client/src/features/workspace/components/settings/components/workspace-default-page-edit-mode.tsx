import { Group, SegmentedControl, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { workspaceAtom } from "@/features/user/atoms/current-user-atom.ts";
import { PageEditMode } from "@/features/user/types/user.types.ts";
import { updateWorkspace } from "@/features/workspace/services/workspace-service.ts";
import { getApiErrorMessage } from "@/lib/api-error.ts";

export default function WorkspaceDefaultPageEditMode() {
  const { t } = useTranslation();

  return (
    <Group gap="xl" justify="space-between" wrap="nowrap">
      <div>
        <Text size="md">{t("Default page edit mode")}</Text>
        <Text c="dimmed" size="sm">
          {t(
            "Choose the page edit mode new members start with. Existing members are not affected."
          )}
        </Text>
      </div>

      <DefaultPageEditModeControl />
    </Group>
  );
}

function DefaultPageEditModeControl() {
  const { t } = useTranslation();
  const [workspace, setWorkspace] = useAtom(workspaceAtom);
  const defaultPageEditMode =
    workspace?.settings?.defaultPageEditMode ?? PageEditMode.Edit;
  const [value, setValue] = useState<string>(defaultPageEditMode);

  const handleChange = async (newValue: string) => {
    const prevValue = value;
    setValue(newValue);
    try {
      const updatedWorkspace = await updateWorkspace({
        defaultPageEditMode: newValue,
      });
      setWorkspace(updatedWorkspace);
    } catch (err) {
      setValue(prevValue);
      notifications.show({
        color: "red",
        message: getApiErrorMessage(err, t("Failed to update setting")),
      });
    }
  };

  useEffect(() => {
    if (defaultPageEditMode !== value) {
      setValue(defaultPageEditMode);
    }
  }, [defaultPageEditMode, value]);

  return (
    <SegmentedControl
      aria-label={t("Default page edit mode")}
      data={[
        { label: t("Edit"), value: PageEditMode.Edit },
        { label: t("Read"), value: PageEditMode.Read },
      ]}
      onChange={handleChange}
      value={value}
    />
  );
}
