import { ActionIcon, Group, Menu, Table, Text } from "@mantine/core";
import { IconDots, IconEdit, IconTrash } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import NoTableResults from "@/components/common/no-table-results";
import { CustomAvatar } from "@/components/ui/custom-avatar.tsx";
import { IScimToken } from "@/ee/scim/types/scim-token.types";
import { formatLocalized, useDateFnsLocale } from "@/lib/date-locale.ts";

interface ScimTokenTableProps {
  isLoading?: boolean;
  onRevoke?: (token: IScimToken) => void;
  onUpdate?: (token: IScimToken) => void;
  tokens: IScimToken[];
}

export function ScimTokenTable({
  tokens,
  isLoading,
  onUpdate,
  onRevoke,
}: ScimTokenTableProps) {
  const { t } = useTranslation();
  const locale = useDateFnsLocale();

  const formatDate = (date: Date | string | null) => {
    if (!date) {
      return t("Never");
    }
    return formatLocalized(date, "MMM dd, yyyy", "PP", locale);
  };

  return (
    <Table.ScrollContainer minWidth={500}>
      <Table highlightOnHover verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{t("Name")}</Table.Th>
            <Table.Th>{t("Token")}</Table.Th>
            <Table.Th>{t("Created by")}</Table.Th>
            <Table.Th>{t("Last used")}</Table.Th>
            <Table.Th>{t("Created")}</Table.Th>
            <Table.Th aria-label={t("Action")} />
          </Table.Tr>
        </Table.Thead>

        <Table.Tbody>
          {tokens && tokens.length > 0 ? (
            tokens.map((token) => (
              <Table.Tr key={token.id}>
                <Table.Td>
                  <Text fw={500} fz="sm">
                    {token.name}
                  </Text>
                </Table.Td>

                <Table.Td>
                  <Text c="dimmed" ff="monospace" fz="sm">
                    ••••{token.tokenLastFour}
                  </Text>
                </Table.Td>

                {token.creator ? (
                  <Table.Td>
                    <Group gap="4" wrap="nowrap">
                      <CustomAvatar
                        avatarUrl={token.creator?.avatarUrl}
                        name={token.creator.name}
                        size="sm"
                      />
                      <Text fz="sm" lineClamp={1}>
                        {token.creator.name}
                      </Text>
                    </Group>
                  </Table.Td>
                ) : (
                  <Table.Td>
                    <Text c="dimmed" fz="sm">
                      —
                    </Text>
                  </Table.Td>
                )}

                <Table.Td>
                  <Text fz="sm" style={{ whiteSpace: "nowrap" }}>
                    {formatDate(token.lastUsedAt)}
                  </Text>
                </Table.Td>

                <Table.Td>
                  <Text fz="sm" style={{ whiteSpace: "nowrap" }}>
                    {formatDate(token.createdAt)}
                  </Text>
                </Table.Td>

                <Table.Td>
                  <Menu position="bottom-end" withinPortal>
                    <Menu.Target>
                      <ActionIcon
                        aria-label={t("Token actions")}
                        color="gray"
                        variant="subtle"
                      >
                        <IconDots size={16} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      {onUpdate && (
                        <Menu.Item
                          leftSection={<IconEdit size={16} />}
                          onClick={() => onUpdate(token)}
                        >
                          {t("Rename")}
                        </Menu.Item>
                      )}
                      {onRevoke && (
                        <Menu.Item
                          color="red"
                          leftSection={<IconTrash size={16} />}
                          onClick={() => onRevoke(token)}
                        >
                          {t("Revoke")}
                        </Menu.Item>
                      )}
                    </Menu.Dropdown>
                  </Menu>
                </Table.Td>
              </Table.Tr>
            ))
          ) : (
            <NoTableResults colSpan={6} />
          )}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
