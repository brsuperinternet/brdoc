import { Button, Group, Text, Tooltip } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ResponsiveSettingsContent,
  ResponsiveSettingsControl,
  ResponsiveSettingsRow,
} from "@/components/ui/responsive-settings-row";
import { Feature } from "@/ee/features";
import { useHasFeature } from "@/ee/hooks/use-feature";
import { useUpgradeLabel } from "@/ee/hooks/use-upgrade-label";
import {
  getMfaStatus,
  MfaBackupCodesModal,
  MfaDisableModal,
  MfaSetupModal,
} from "@/ee/mfa";

export function MfaSettings() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [disableModalOpen, setDisableModalOpen] = useState(false);
  const [backupCodesModalOpen, setBackupCodesModalOpen] = useState(false);
  const canUseMfa = useHasFeature(Feature.MFA);
  const upgradeLabel = useUpgradeLabel();

  const { data: mfaStatus, isLoading } = useQuery({
    queryFn: getMfaStatus,
    queryKey: ["mfa-status"],
  });

  if (isLoading || !mfaStatus) {
    return null;
  }

  // Check if MFA is truly enabled
  const isMfaEnabled = mfaStatus?.isEnabled === true;

  const handleSetupComplete = () => {
    setSetupModalOpen(false);
    queryClient.invalidateQueries({ queryKey: ["mfa-status"] });
    notifications.show({
      message: t("Two-factor authentication has been enabled"),
      title: t("Success"),
    });
  };

  const handleDisableComplete = () => {
    setDisableModalOpen(false);
    queryClient.invalidateQueries({ queryKey: ["mfa-status"] });
    notifications.show({
      color: "blue",
      message: t("Two-factor authentication has been disabled"),
      title: t("Success"),
    });
  };

  return (
    <>
      <ResponsiveSettingsRow>
        <ResponsiveSettingsContent>
          <Text size="md">{t("2-step verification")}</Text>
          <Text c="dimmed" size="sm">
            {isMfaEnabled
              ? t("Two-factor authentication is active on your account.")
              : t(
                  "Protect your account with an additional verification layer when signing in."
                )}
          </Text>
        </ResponsiveSettingsContent>

        <ResponsiveSettingsControl>
          {isMfaEnabled ? (
            <Group gap="sm" wrap="nowrap">
              <Button
                onClick={() => setBackupCodesModalOpen(true)}
                size="sm"
                style={{ whiteSpace: "nowrap" }}
                variant="default"
              >
                {t("Backup codes")} ({mfaStatus?.backupCodesCount || 0})
              </Button>
              <Button
                color="red"
                onClick={() => setDisableModalOpen(true)}
                size="sm"
                style={{ whiteSpace: "nowrap" }}
                variant="default"
              >
                {t("Disable")}
              </Button>
            </Group>
          ) : (
            <Tooltip disabled={canUseMfa} label={upgradeLabel}>
              <Button
                disabled={!canUseMfa}
                onClick={() => setSetupModalOpen(true)}
                style={{ whiteSpace: "nowrap" }}
                variant="default"
              >
                {t("Add 2FA method")}
              </Button>
            </Tooltip>
          )}
        </ResponsiveSettingsControl>
      </ResponsiveSettingsRow>

      <MfaSetupModal
        onClose={() => setSetupModalOpen(false)}
        onComplete={handleSetupComplete}
        opened={setupModalOpen}
      />

      <MfaDisableModal
        onClose={() => setDisableModalOpen(false)}
        onComplete={handleDisableComplete}
        opened={disableModalOpen}
      />

      <MfaBackupCodesModal
        onClose={() => setBackupCodesModalOpen(false)}
        opened={backupCodesModalOpen}
      />
    </>
  );
}
