import { Button, Group, Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { useTranslation } from "react-i18next";
import { useRemoveLicenseMutation } from "@/ee/licence/queries/license-query.ts";

export default function RemoveLicense() {
  const { t } = useTranslation();
  const removeLicenseMutation = useRemoveLicenseMutation();

  const openDeleteModal = () =>
    modals.openConfirmModal({
      centered: true,
      children: (
        <Text size="sm">
          {t(
            "Are you sure you want to remove your license key? Your workspace will be downgraded to the non-enterprise version."
          )}
        </Text>
      ),
      confirmProps: { color: "red" },
      labels: { cancel: t("Don't"), confirm: t("Remove") },
      onConfirm: () => removeLicenseMutation.mutate(),
      title: t("Remove license key"),
    });

  return (
    <Group>
      <Button color="red" onClick={openDeleteModal} variant="light">
        Remove license
      </Button>
    </Group>
  );
}
