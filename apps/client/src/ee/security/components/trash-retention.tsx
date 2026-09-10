import {
  Button,
  Group,
  NumberInput,
  Select,
  Text,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Feature } from "@/ee/features";
import { useHasFeature } from "@/ee/hooks/use-feature";
import { useUpgradeLabel } from "@/ee/hooks/use-upgrade-label.ts";
import { workspaceAtom } from "@/features/user/atoms/current-user-atom.ts";
import { updateWorkspace } from "@/features/workspace/services/workspace-service.ts";

type RetentionUnit = "days" | "months" | "years";

const DEFAULT_RETENTION_DAYS = 30;

function daysToRetention(days: number): {
  amount: number;
  unit: RetentionUnit;
} {
  if (days >= 365 && days % 365 === 0) {
    return { amount: days / 365, unit: "years" };
  }
  if (days >= 30 && days % 30 === 0) {
    return { amount: days / 30, unit: "months" };
  }
  return { amount: days, unit: "days" };
}

function retentionToDays(amount: number, unit: RetentionUnit): number {
  if (unit === "years") {
    return amount * 365;
  }
  if (unit === "months") {
    return amount * 30;
  }
  return amount;
}

export default function TrashRetention() {
  const { t } = useTranslation();
  const hasRetention = useHasFeature(Feature.RETENTION);
  const upgradeLabel = useUpgradeLabel();
  const [workspace, setWorkspace] = useAtom(workspaceAtom);

  const currentDays = workspace?.trashRetentionDays ?? DEFAULT_RETENTION_DAYS;
  const parsed = daysToRetention(currentDays);

  const [retentionAmount, setRetentionAmount] = useState<number | string>(
    parsed.amount
  );
  const [retentionUnit, setRetentionUnit] = useState<RetentionUnit>(
    parsed.unit
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const days = workspace?.trashRetentionDays ?? DEFAULT_RETENTION_DAYS;
    const { amount, unit } = daysToRetention(days);
    setRetentionAmount(amount);
    setRetentionUnit(unit);
  }, [workspace?.trashRetentionDays]);

  const handleSave = async () => {
    const num = typeof retentionAmount === "number" ? retentionAmount : 1;
    const clamped = Math.max(1, num);
    setRetentionAmount(clamped);
    const days = retentionToDays(clamped, retentionUnit);

    if (days === currentDays) {
      return;
    }

    setSaving(true);
    try {
      const updatedWorkspace = await updateWorkspace({
        trashRetentionDays: days,
      });
      setWorkspace(updatedWorkspace);
      notifications.show({
        message: t("Trash retention updated"),
      });
    } catch (err: any) {
      notifications.show({
        color: "red",
        message:
          err?.response?.data?.message || t("Failed to update trash retention"),
      });
      const { amount, unit } = daysToRetention(currentDays);
      setRetentionAmount(amount);
      setRetentionUnit(unit);
    } finally {
      setSaving(false);
    }
  };

  const isDirty =
    retentionToDays(
      typeof retentionAmount === "number" ? retentionAmount : 1,
      retentionUnit
    ) !== currentDays;

  return (
    <div>
      <Text size="md">{t("Trash retention")}</Text>
      <Text c="dimmed" mb="sm" size="sm">
        {t("Pages in trash will be permanently deleted after this period.")}
      </Text>

      <Tooltip disabled={hasRetention} label={upgradeLabel}>
        <Group gap="xs" maw={320} wrap="nowrap">
          <NumberInput
            disabled={!hasRetention}
            hideControls
            min={1}
            onChange={(val) => setRetentionAmount(val)}
            size="sm"
            value={retentionAmount}
            w={60}
          />
          <Select
            data={[
              { label: t("days"), value: "days" },
              { label: t("months"), value: "months" },
              { label: t("years"), value: "years" },
            ]}
            disabled={!hasRetention}
            onChange={(value) => {
              if (value === "days" || value === "months" || value === "years") {
                setRetentionUnit(value);
              }
            }}
            size="sm"
            style={{ flex: 1 }}
            value={retentionUnit}
          />
          <Button
            disabled={!(hasRetention && isDirty)}
            loading={saving}
            onClick={handleSave}
            size="sm"
          >
            {t("Save")}
          </Button>
        </Group>
      </Tooltip>
    </div>
  );
}
