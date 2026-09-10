import { Group, Switch, Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { useAtom } from "jotai";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { workspaceAtom } from "@/features/user/atoms/current-user-atom.ts";
import { updateWorkspace } from "@/features/workspace/services/workspace-service.ts";

export default function AllowPublicSpaces() {
  const { t } = useTranslation();
  const [workspace] = useAtom(workspaceAtom);

  return (
    <>
      <Group gap="xl" justify="space-between" wrap="nowrap">
        <div>
          <Text size="md">{t("Allow public spaces")}</Text>
          <Text c="dimmed" size="sm">
            {t("Space admins can publish their spaces to the web.")}
          </Text>
        </div>

        <AllowPublicSpacesToggle />
      </Group>

      {workspace?.settings?.publicSpaces?.enabled === true && (
        <Group gap="xl" justify="space-between" mt="md" wrap="nowrap">
          <div>
            <Text size="md">{t("Show public directory")}</Text>
            <Text c="dimmed" size="sm">
              {t("List published spaces at /docs for anyone to browse.")}
            </Text>
          </div>

          <PublicSpacesDirectoryToggle />
        </Group>
      )}
    </>
  );
}

function PublicSpacesDirectoryToggle() {
  const { t } = useTranslation();
  const [workspace, setWorkspace] = useAtom(workspaceAtom);
  const [checked, setChecked] = useState(
    workspace?.settings?.publicSpaces?.directory === true
  );

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.currentTarget.checked;
    try {
      const updatedWorkspace = await updateWorkspace({
        publicSpacesDirectory: value,
      });
      setChecked(value);
      setWorkspace(updatedWorkspace);
    } catch (err) {
      notifications.show({
        color: "red",
        message: err?.response?.data?.message,
      });
    }
  };

  return (
    <Switch
      aria-label={t("Toggle show public directory")}
      checked={checked}
      onChange={handleChange}
    />
  );
}

function AllowPublicSpacesToggle() {
  const { t } = useTranslation();
  const [workspace, setWorkspace] = useAtom(workspaceAtom);
  const [checked, setChecked] = useState(
    workspace?.settings?.publicSpaces?.enabled === true
  );

  const applyChange = async (value: boolean) => {
    try {
      const updatedWorkspace = await updateWorkspace({
        allowPublicSpaces: value,
      });
      setChecked(value);
      setWorkspace(updatedWorkspace);
    } catch (err) {
      notifications.show({
        color: "red",
        message: err?.response?.data?.message,
      });
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.currentTarget.checked;
    modals.openConfirmModal({
      centered: true,
      children: (
        <Text size="sm">
          {value
            ? t(
                "Space admins will be able to make their spaces publicly readable by anyone on the internet. Are you sure?"
              )
            : t(
                "This will immediately unpublish every published space. Re-enabling later will not republish them. Are you sure?"
              )}
        </Text>
      ),
      confirmProps: value ? undefined : { color: "red" },
      labels: {
        cancel: t("Cancel"),
        confirm: value ? t("Allow") : t("Disable"),
      },
      onConfirm: () => applyChange(value),
      title: value ? t("Allow public spaces") : t("Disable public spaces"),
    });
  };

  return (
    <Switch
      aria-label={t("Toggle allow public spaces")}
      checked={checked}
      onChange={handleChange}
    />
  );
}
