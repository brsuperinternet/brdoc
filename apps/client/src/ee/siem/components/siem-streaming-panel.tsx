import { Alert, Button, Group, Tooltip } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconAlertCircle, IconInfoCircle } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Feature } from "@/ee/features";
import { useHasFeature } from "@/ee/hooks/use-feature";
import { DeleteDestinationModal } from "@/ee/siem/components/delete-destination-modal";
import { DestinationFormModal } from "@/ee/siem/components/destination-form-modal";
import { DestinationTable } from "@/ee/siem/components/destination-table";
import {
  extractErrorMessage,
  useRetrySiemDestinationMutation,
  useSiemDestinationsQuery,
  useTestSiemDestinationMutation,
  useUpdateSiemDestinationMutation,
} from "@/ee/siem/queries/siem-query";
import {
  ISiemDestination,
  SIEM_MAX_DESTINATIONS_PER_WORKSPACE,
} from "@/ee/siem/types/siem.types";
import useUserRole from "@/hooks/use-user-role";

export default function SiemStreamingPanel() {
  const { t } = useTranslation();
  const { isOwner } = useUserRole();
  const hasFeature = useHasFeature(Feature.SIEM);
  const { data, isLoading, isError, error } =
    useSiemDestinationsQuery(hasFeature);
  const updateMutation = useUpdateSiemDestinationMutation();
  const retryMutation = useRetrySiemDestinationMutation();
  const testMutation = useTestSiemDestinationMutation();
  const [formOpened, setFormOpened] = useState(false);
  const [deleteOpened, setDeleteOpened] = useState(false);
  const [selected, setSelected] = useState<ISiemDestination | null>(null);

  if (!isOwner) {
    return null;
  }

  const atDestinationLimit =
    (data?.length ?? 0) >= SIEM_MAX_DESTINATIONS_PER_WORKSPACE;

  const handleTest = async (destination: ISiemDestination) => {
    const result = await testMutation
      .mutateAsync({
        config: destination.config as unknown as Record<string, unknown>,
        destinationId: destination.id,
        type: destination.type,
      })
      .catch(() => null);
    if (!result) {
      return;
    }
    notifications.show({
      color: result.delivered ? "green" : "red",
      message: result.delivered
        ? t("Test event delivered to {{name}}", { name: destination.name })
        : result.error,
    });
  };

  return (
    <>
      {!hasFeature && (
        <Alert color="yellow" icon={<IconInfoCircle size={16} />} mb="md">
          {t("SIEM streaming requires an Enterprise license.")}
        </Alert>
      )}

      <Group justify="flex-end" mb="md">
        <Tooltip
          disabled={!atDestinationLimit}
          label={t("Maximum of {{limit}} destinations reached", {
            limit: SIEM_MAX_DESTINATIONS_PER_WORKSPACE,
          })}
        >
          <span>
            <Button
              disabled={!hasFeature || atDestinationLimit}
              onClick={() => {
                setSelected(null);
                setFormOpened(true);
              }}
            >
              {t("Add destination")}
            </Button>
          </span>
        </Tooltip>
      </Group>

      {isError && (
        <Alert color="red" icon={<IconAlertCircle size={16} />} mb="md">
          {t("Could not load SIEM destinations: {{message}}", {
            message: extractErrorMessage(error),
          })}
        </Alert>
      )}

      {hasFeature && !isError && (
        <DestinationTable
          destinations={data}
          isLoading={isLoading}
          onDelete={(destination) => {
            setSelected(destination);
            setDeleteOpened(true);
          }}
          onEdit={(destination) => {
            setSelected(destination);
            setFormOpened(true);
          }}
          onRetry={(destination) =>
            retryMutation.mutate({ destinationId: destination.id })
          }
          onTest={handleTest}
          onToggle={(destination, enabled) =>
            updateMutation.mutate({ destinationId: destination.id, enabled })
          }
        />
      )}

      <DestinationFormModal
        destination={selected}
        onClose={() => setFormOpened(false)}
        opened={formOpened}
      />
      <DeleteDestinationModal
        destination={selected}
        onClose={() => setDeleteOpened(false)}
        opened={deleteOpened}
      />
    </>
  );
}
