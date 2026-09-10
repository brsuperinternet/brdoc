import {
  ActionIcon,
  Button,
  Group,
  NumberInput,
  Popover,
  Select,
  Space,
  Tabs,
  Text,
  Tooltip,
} from "@mantine/core";
import { IconSettings } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import Paginate from "@/components/common/paginate";
import SettingsTitle from "@/components/settings/settings-title";
import { DocumentTitle } from "@/components/ui/document-title.tsx";
import AuditLogsTable from "@/ee/audit/components/audit-logs-table";
import { eventFilterOptions } from "@/ee/audit/lib/audit-event-labels";
import {
  useAuditLogsQuery,
  useAuditRetentionQuery,
  useUpdateAuditRetentionMutation,
} from "@/ee/audit/queries/audit-query";
import { IAuditLogParams } from "@/ee/audit/types/audit.types";
import SiemStreamingPanel from "@/ee/siem/components/siem-streaming-panel";
import { useCursorPaginate } from "@/hooks/use-cursor-paginate";
import useUserRole from "@/hooks/use-user-role";

type RetentionUnit = "days" | "months" | "years";

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

export default function AuditLogs() {
  const { t } = useTranslation();
  const { isOwner } = useUserRole();
  const { cursor, goNext, goPrev, resetCursor } = useCursorPaginate();
  const location = useLocation();
  const navigate = useNavigate();

  const [eventFilter, setEventFilter] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { data: retentionData } = useAuditRetentionQuery();
  const updateRetention = useUpdateAuditRetentionMutation();

  const currentDays = retentionData?.retentionDays ?? 365;
  const parsed = daysToRetention(currentDays);
  const [retentionAmount, setRetentionAmount] = useState<number | string>(
    parsed.amount
  );
  const [retentionUnit, setRetentionUnit] = useState<RetentionUnit>(
    parsed.unit
  );

  useEffect(() => {
    if (retentionData) {
      const { amount, unit } = daysToRetention(retentionData.retentionDays);
      setRetentionAmount(amount);
      setRetentionUnit(unit);
    }
  }, [retentionData?.retentionDays]);

  const resetRetentionForm = () => {
    const { amount, unit } = daysToRetention(currentDays);
    setRetentionAmount(amount);
    setRetentionUnit(unit);
  };

  const params: IAuditLogParams = useMemo(
    () => ({
      cursor,
      event: eventFilter ?? undefined,
      limit: 50,
    }),
    [cursor, eventFilter]
  );

  const { data, isLoading } = useAuditLogsQuery(params);

  const activeTab = location.pathname.endsWith("/siem") ? "siem" : "audit";

  if (!isOwner) {
    return null;
  }

  const handleEventChange = (value: string | null) => {
    setEventFilter(value);
    resetCursor();
  };

  const handleTabChange = (value: string | null) => {
    if (value === "siem") {
      navigate("/settings/audit/siem");
    } else {
      navigate("/settings/audit");
    }
  };

  return (
    <>
      <DocumentTitle title={t("Audit logs & SIEM")} />

      <SettingsTitle title={t("Audit logs & SIEM")} />

      <Tabs color="dark" onChange={handleTabChange} value={activeTab}>
        <Tabs.List>
          <Tabs.Tab fw={500} value="audit">
            {t("Audit logs")}
          </Tabs.Tab>
          <Tabs.Tab fw={500} value="siem">
            {t("SIEM")}
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel pt="md" value="audit">
          <Group gap="sm" mb="md">
            <Select
              clearable
              data={eventFilterOptions.map((group) => ({
                group: t(group.group),
                items: group.items.map((item) => ({
                  label: t(item.label),
                  value: item.value,
                })),
              }))}
              onChange={handleEventChange}
              placeholder={t("Filter by event")}
              searchable
              size="sm"
              value={eventFilter}
              w={220}
            />

            <Popover
              onChange={(opened) => {
                if (!opened) {
                  resetRetentionForm();
                }
                setSettingsOpen(opened);
              }}
              opened={settingsOpen}
              position="bottom-end"
              shadow="md"
              width={260}
              withArrow
            >
              <Popover.Target>
                <Tooltip label={t("Audit settings")}>
                  <ActionIcon
                    ml="auto"
                    onClick={() => setSettingsOpen((o) => !o)}
                    size="input-sm"
                    variant="default"
                  >
                    <IconSettings size={16} />
                  </ActionIcon>
                </Tooltip>
              </Popover.Target>
              <Popover.Dropdown>
                <Text fw={500} fz="sm" mb={4}>
                  {t("Retention")}
                </Text>
                <Text c="dimmed" fz="xs" mb="sm">
                  {t("Logs older than this period are automatically deleted.")}
                </Text>
                <Group gap="xs" mb="sm" wrap="nowrap">
                  <NumberInput
                    hideControls
                    min={1}
                    onChange={(val) => setRetentionAmount(val)}
                    size="sm"
                    value={retentionAmount}
                    w={60}
                  />
                  <Select
                    comboboxProps={{ withinPortal: false }}
                    data={[
                      { label: t("days"), value: "days" },
                      { label: t("months"), value: "months" },
                      { label: t("years"), value: "years" },
                    ]}
                    onChange={(value) => {
                      if (
                        value === "days" ||
                        value === "months" ||
                        value === "years"
                      ) {
                        setRetentionUnit(value);
                      }
                    }}
                    size="sm"
                    style={{ flex: 1 }}
                    value={retentionUnit}
                  />
                </Group>
                <Group gap="xs" grow>
                  <Button
                    onClick={() => {
                      resetRetentionForm();
                      setSettingsOpen(false);
                    }}
                    size="xs"
                    variant="default"
                  >
                    {t("Cancel")}
                  </Button>
                  <Button
                    loading={updateRetention.isPending}
                    onClick={() => {
                      const num =
                        typeof retentionAmount === "number"
                          ? retentionAmount
                          : 1;
                      const clamped = Math.max(1, num);
                      setRetentionAmount(clamped);
                      const days = retentionToDays(clamped, retentionUnit);
                      if (days !== currentDays) {
                        updateRetention.mutate({ auditRetentionDays: days });
                      }
                      setSettingsOpen(false);
                    }}
                    size="xs"
                  >
                    {t("Save")}
                  </Button>
                </Group>
              </Popover.Dropdown>
            </Popover>
          </Group>

          <AuditLogsTable isLoading={isLoading} items={data?.items} />

          <Space h="md" />

          {data?.items && data.items.length > 0 && (
            <Paginate
              hasNextPage={data?.meta?.hasNextPage}
              hasPrevPage={data?.meta?.hasPrevPage}
              onNext={() => goNext(data?.meta?.nextCursor)}
              onPrev={goPrev}
            />
          )}
        </Tabs.Panel>

        <Tabs.Panel pt="md" value="siem">
          <SiemStreamingPanel />
        </Tabs.Panel>
      </Tabs>
    </>
  );
}
