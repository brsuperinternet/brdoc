import { Group, List, Stack, Table, Text, ThemeIcon } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";

const enterpriseFeatures = [
  "AI Integration (Chat, Search & Assistant)",
  "MCP Support",
  "SSO (SAML, OIDC, LDAP)",
  "SCIM Provisioning",
  "Multi-factor Authentication (2FA)",
  "Page-level Permissions",
  "Page Verification & Approval Workflow",
  "Audit Logs",
  "Enterprise Controls",
  "API Keys",
  "Advanced Search Engine Support",
  "Full-text Search in Attachments (PDF, DOCX)",
  "Resolve Comments",
  "Confluence Import",
  "PDF & DOCX Import",
  "Bases",
  "Kanban",
  "Templates",
  "Personal Spaces",
];

export default function OssDetails() {
  return (
    <Stack gap="lg">
      <Table.ScrollContainer minWidth={500} py="md">
        <Table
          layout="fixed"
          variant="vertical"
          verticalSpacing="sm"
          withTableBorder
        >
          <Table.Tbody>
            <Table.Tr>
              <Table.Th w={160}>Edition</Table.Th>
              <Table.Td>
                <Group wrap="nowrap">
                  Open Source
                  <div>
                    <ThemeIcon
                      color="green"
                      radius="xl"
                      size={24}
                      variant="light"
                    >
                      <IconCheck size={16} />
                    </ThemeIcon>
                  </div>
                </Group>
              </Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>

      <Stack gap="md">
        <Text fw={500}>Upgrade to the Enterprise Edition to unlock:</Text>

        <List
          icon={
            <ThemeIcon color={"gray"} radius="xl" size={20}>
              <IconCheck size={14} />
            </ThemeIcon>
          }
          size="sm"
          spacing={4}
        >
          {enterpriseFeatures.map((feature) => (
            <List.Item key={feature}>{feature}</List.Item>
          ))}
        </List>

        <Text c="dimmed" size="sm">
          Get an enterprise trial key at{" "}
          <a
            href="https://customers.docmost.com/"
            rel="noopener noreferrer"
            target="_blank"
          >
            customers.docmost.com
          </a>
          .
        </Text>

        <Text c="dimmed" size="sm">
          Visit{" "}
          <a
            href="https://docmost.com/pricing"
            rel="noopener noreferrer"
            target="_blank"
          >
            docmost.com/pricing
          </a>{" "}
          to purchase an enterprise license.
        </Text>
        <Text c="dimmed" size="sm">
          For inquiries, contact{" "}
          <a href="mailto:sales@docmost.com">sales@docmost.com</a>
        </Text>
      </Stack>
    </Stack>
  );
}
