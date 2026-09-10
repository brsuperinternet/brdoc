import {
  Anchor,
  Box,
  Collapse,
  Group,
  Skeleton,
  Table,
  Text,
} from "@mantine/core";
import {
  IconArrowRight,
  IconChevronDown,
  IconChevronRight,
} from "@tabler/icons-react";
import { Fragment, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import NoTableResults from "@/components/common/no-table-results";
import { CustomAvatar } from "@/components/ui/custom-avatar";
import { getEventLabel } from "@/ee/audit/lib/audit-event-labels";
import { IAuditLog } from "@/ee/audit/types/audit.types";
import { formattedDate } from "@/lib/time";
import classes from "./audit-logs.module.css";

type AuditLogsTableProps = {
  items?: IAuditLog[];
  isLoading: boolean;
};

function hasDetails(entry: IAuditLog): boolean {
  return !!(entry.changes?.before || entry.changes?.after || entry.metadata);
}

function getResourceUrl(entry: IAuditLog): string | null {
  if (!entry.resource) {
    return null;
  }

  switch (entry.resourceType) {
    case "group":
      return `/settings/groups/${entry.resource.id}`;
    case "space":
    case "space_member":
      return entry.resource.slug ? `/s/${entry.resource.slug}` : null;
    default:
      return null;
  }
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "—";
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

function ChangesDiff({ changes }: { changes: IAuditLog["changes"] }) {
  const { t } = useTranslation();
  if (!changes) {
    return null;
  }

  const { before, after } = changes;
  const allKeys = new Set([
    ...Object.keys(before ?? {}),
    ...Object.keys(after ?? {}),
  ]);

  if (allKeys.size === 0) {
    return null;
  }

  return (
    <Box>
      <Text fw={600} fz="xs" mb={4}>
        {t("Changes")}
      </Text>
      {[...allKeys].map((key) => {
        const hasBefore = before && key in before;
        const hasAfter = after && key in after;

        return (
          <Group align="center" gap={6} key={key} mb={2} wrap="nowrap">
            <Text
              c="dimmed"
              fw={500}
              fz="xs"
              style={{ minWidth: "fit-content" }}
            >
              {key}:
            </Text>
            {hasBefore && (
              <Text component="span" fz="xs">
                {formatValue(before[key])}
              </Text>
            )}
            {hasBefore && hasAfter && (
              <IconArrowRight color="var(--mantine-color-dimmed)" size={10} />
            )}
            {hasAfter && (
              <Text component="span" fz="xs">
                {formatValue(after[key])}
              </Text>
            )}
          </Group>
        );
      })}
    </Box>
  );
}

function MetadataDisplay({ metadata }: { metadata: Record<string, any> }) {
  const { t } = useTranslation();
  const entries = Object.entries(metadata);
  if (entries.length === 0) {
    return null;
  }

  return (
    <Box>
      <Text fw={600} fz="xs" mb={4}>
        {t("Metadata")}
      </Text>
      {entries.map(([key, value]) => (
        <Group gap={6} key={key} mb={2} wrap="nowrap">
          <Text c="dimmed" fw={500} fz="xs">
            {key}:
          </Text>
          <Text fz="xs">{formatValue(value)}</Text>
        </Group>
      ))}
    </Box>
  );
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <Table.Tr key={i}>
          <Table.Td>
            <Group gap="sm" wrap="nowrap">
              <Skeleton circle height={36} />
              <div>
                <Skeleton height={14} mb={4} width={120} />
                <Skeleton height={10} width={160} />
              </div>
            </Group>
          </Table.Td>
          <Table.Td>
            <Skeleton height={14} width={140} />
          </Table.Td>
          <Table.Td>
            <Skeleton height={14} width={120} />
          </Table.Td>
          <Table.Td>
            <Skeleton height={14} width={120} />
          </Table.Td>
        </Table.Tr>
      ))}
    </>
  );
}

function ResourceCell({ entry }: { entry: IAuditLog }) {
  if (!entry.resource?.name) {
    return (
      <Text c="dimmed" fz="sm">
        —
      </Text>
    );
  }

  const url = getResourceUrl(entry);

  if (url) {
    return (
      <Anchor
        component={Link}
        size="sm"
        style={{
          color: "var(--mantine-color-text)",
          cursor: "pointer",
        }}
        to={url}
        underline="never"
      >
        <div className={classes.resourceLinkText}>
          <Text fw={500} fz="sm" lineClamp={1}>
            {entry.resource.name}
          </Text>
        </div>
      </Anchor>
    );
  }

  return (
    <Text fz="sm" lineClamp={1}>
      {entry.resource.name}
    </Text>
  );
}

export default function AuditLogsTable({
  items,
  isLoading,
}: AuditLogsTableProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <Table.ScrollContainer minWidth={700}>
      <Table className={classes.table} highlightOnHover verticalSpacing="xs">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{t("Actor")}</Table.Th>
            <Table.Th>{t("Event")}</Table.Th>
            <Table.Th>{t("Resource")}</Table.Th>
            <Table.Th>{t("Date")}</Table.Th>
          </Table.Tr>
        </Table.Thead>

        <Table.Tbody>
          {isLoading ? (
            <TableSkeleton />
          ) : items && items.length > 0 ? (
            items.map((entry) => {
              const expandable = hasDetails(entry);
              const isExpanded = expanded.has(entry.id);

              return (
                <Fragment key={entry.id}>
                  <Table.Tr
                    onClick={
                      expandable ? () => toggleExpanded(entry.id) : undefined
                    }
                    style={{ cursor: expandable ? "pointer" : undefined }}
                  >
                    <Table.Td>
                      <Group gap="sm" wrap="nowrap">
                        {expandable ? (
                          isExpanded ? (
                            <IconChevronDown
                              color="var(--mantine-color-dimmed)"
                              size={16}
                            />
                          ) : (
                            <IconChevronRight
                              color="var(--mantine-color-dimmed)"
                              size={16}
                            />
                          )
                        ) : (
                          <Box w={16} />
                        )}
                        {entry.actor ? (
                          <Group gap="sm" wrap="nowrap">
                            <CustomAvatar
                              avatarUrl={entry.actor.avatarUrl}
                              name={entry.actor.name}
                              size={36}
                            />
                            <div>
                              <Text fw={500} fz="sm" lineClamp={1}>
                                {entry.actor.name}
                              </Text>
                              <Text c="dimmed" fz="xs">
                                {entry.actor.email}
                              </Text>
                            </div>
                          </Group>
                        ) : (
                          <Text c="dimmed" fs="italic" fz="sm">
                            {entry.actorType === "system"
                              ? t("System")
                              : t("System")}
                          </Text>
                        )}
                      </Group>
                    </Table.Td>

                    <Table.Td>
                      <Text fz="sm">{t(getEventLabel(entry.event))}</Text>
                    </Table.Td>

                    <Table.Td>
                      <ResourceCell entry={entry} />
                    </Table.Td>

                    <Table.Td>
                      <Text fz="sm" style={{ whiteSpace: "nowrap" }}>
                        {formattedDate(new Date(entry.createdAt))}
                      </Text>
                    </Table.Td>
                  </Table.Tr>

                  {expandable && (
                    <Table.Tr className={classes.detailRow}>
                      <Table.Td colSpan={4} p={0}>
                        <Collapse expanded={isExpanded}>
                          <Box
                            className={classes.detailContent}
                            px="md"
                            py="sm"
                          >
                            <Group align="flex-start" gap="xl">
                              {entry.changes && (
                                <ChangesDiff changes={entry.changes} />
                              )}
                              {entry.metadata && (
                                <MetadataDisplay metadata={entry.metadata} />
                              )}
                            </Group>
                          </Box>
                        </Collapse>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Fragment>
              );
            })
          ) : (
            <NoTableResults colSpan={4} />
          )}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
