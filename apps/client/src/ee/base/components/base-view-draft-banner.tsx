import { Button, Group, Tooltip } from "@mantine/core";
import { useTranslation } from "react-i18next";

type BaseViewDraftBannerProps = {
  isDirty: boolean;
  canSave: boolean;
  onReset: () => void;
  onSave: () => void;
  saving: boolean;
};

export function BaseViewDraftBanner({
  isDirty,
  canSave,
  onReset,
  onSave,
  saving,
}: BaseViewDraftBannerProps) {
  const { t } = useTranslation();
  if (!isDirty) {
    return null;
  }
  return (
    <Group gap="xs" justify="flex-end" px="md" py={6} wrap="nowrap">
      <Button color="gray" onClick={onReset} size="xs" variant="subtle">
        {t("Reset")}
      </Button>
      {canSave && (
        <Tooltip
          label={t("Filter and sort changes are visible only to you")}
          position="top"
          withArrow
        >
          <Button
            color="orange"
            loading={saving}
            onClick={onSave}
            size="xs"
            variant="light"
          >
            {t("Save for everyone")}
          </Button>
        </Tooltip>
      )}
    </Group>
  );
}
