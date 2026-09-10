import {
  ActionIcon,
  Badge,
  Card,
  Group,
  Menu,
  Table,
  Text,
  ThemeIcon,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import {
  IconCheck,
  IconDots,
  IconLock,
  IconPencil,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { GoogleIcon } from "@/components/icons/google-icon.tsx";
import SsoProviderModal from "@/ee/security/components/sso-provider-modal.tsx";
import { SSO_PROVIDER } from "@/ee/security/contants.ts";
import {
  useDeleteSsoProviderMutation,
  useGetSsoProviders,
} from "@/ee/security/queries/security-query.ts";
import { IAuthProvider } from "@/ee/security/types/security.types.ts";

export default function SsoProviderList() {
  const { t } = useTranslation();
  const { data, isLoading } = useGetSsoProviders();
  const [opened, { open, close }] = useDisclosure(false);
  const deleteSsoProviderMutation = useDeleteSsoProviderMutation();
  const [editProvider, setEditProvider] = useState<IAuthProvider | null>(null);

  if (isLoading || !data) {
    return null;
  }

  if (data?.items.length === 0) {
    return <Text c="dimmed">{t("No SSO providers found.")}</Text>;
  }

  const handleEdit = (provider: IAuthProvider) => {
    setEditProvider(provider);
    open();
  };

  const openDeleteModal = (providerId: string) =>
    modals.openConfirmModal({
      centered: true,
      children: (
        <Text size="sm">
          {t("Are you sure you want to delete this SSO provider?")}
        </Text>
      ),
      confirmProps: { color: "red" },
      labels: { cancel: t("Don't"), confirm: t("Delete") },
      onConfirm: () => deleteSsoProviderMutation.mutateAsync(providerId),
      title: t("Delete SSO provider"),
    });

  return (
    <>
      <Card radius="sm" shadow="sm">
        <Table.ScrollContainer maxHeight={400} minWidth={600}>
          <Table stickyHeader verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t("Name")}</Table.Th>
                <Table.Th>{t("Type")}</Table.Th>
                <Table.Th>{t("Status")}</Table.Th>
                <Table.Th>{t("Allow signup")}</Table.Th>
                <Table.Th>{t("Action")}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data?.items
                .sort((a, b) => {
                  const enabledDiff = Number(b.isEnabled) - Number(a.isEnabled);
                  if (enabledDiff !== 0) {
                    return enabledDiff;
                  }
                  return a.name.localeCompare(b.name);
                })
                .map((provider: IAuthProvider, index) => (
                  <Table.Tr key={index}>
                    <Table.Td>
                      <Group gap="xs" wrap="nowrap">
                        {provider.type === SSO_PROVIDER.GOOGLE ? (
                          <GoogleIcon size={16} />
                        ) : (
                          <IconLock size={16} />
                        )}
                        <div>
                          <Text fw={500} fz="sm">
                            {provider.name}
                          </Text>
                        </div>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={"gray"}
                        style={{ whiteSpace: "nowrap" }}
                        variant="light"
                      >
                        {provider.type.toUpperCase()}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={provider.isEnabled ? "blue" : "gray"}
                        variant="light"
                      >
                        {provider.isEnabled ? "Active" : "InActive"}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      {provider.allowSignup ? (
                        <ThemeIcon radius="xl" size={24} variant="light">
                          <IconCheck size={16} />
                        </ThemeIcon>
                      ) : (
                        <ThemeIcon
                          color="red"
                          radius="xl"
                          size={24}
                          variant="light"
                        >
                          <IconX size={16} />
                        </ThemeIcon>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs" wrap="nowrap">
                        <ActionIcon
                          aria-label={t("Edit {{name}}", {
                            name: provider.name,
                          })}
                          color="gray"
                          onClick={() => handleEdit(provider)}
                          variant="subtle"
                        >
                          <IconPencil size={16} />
                        </ActionIcon>
                        <Menu
                          position="bottom-end"
                          transitionProps={{ transition: "pop" }}
                          withArrow
                          withinPortal
                        >
                          <Menu.Target>
                            <ActionIcon
                              aria-label={t("More actions for {{name}}", {
                                name: provider.name,
                              })}
                              color="gray"
                              variant="subtle"
                            >
                              <IconDots size={16} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item
                              leftSection={<IconPencil size={16} />}
                              onClick={() => handleEdit(provider)}
                            >
                              {t("Edit")}
                            </Menu.Item>
                            <Menu.Item
                              color="red"
                              disabled={provider.type === SSO_PROVIDER.GOOGLE}
                              leftSection={<IconTrash size={16} />}
                              onClick={() => openDeleteModal(provider.id)}
                            >
                              {t("Delete")}
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Card>

      <SsoProviderModal
        onClose={close}
        opened={opened}
        provider={editProvider}
      />
    </>
  );
}
