import { ActionIcon, Group, Text, Tooltip } from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { CustomAvatar } from "@/components/ui/custom-avatar";
import { IVerifier } from "@/ee/page-verification/types/page-verification.types";

type VerifierListProps = {
  verifiers: IVerifier[];
  canManage?: boolean;
  onRemove?: (userId: string) => void;
};

export function VerifierList({
  verifiers,
  canManage,
  onRemove,
}: VerifierListProps) {
  const { t } = useTranslation();

  if (verifiers.length === 0) {
    return null;
  }

  return (
    <>
      {verifiers.map((verifier, index) => (
        <Group
          justify="space-between"
          key={verifier.id}
          py={6}
          style={{
            borderBottom:
              index < verifiers.length - 1
                ? "1px solid var(--mantine-color-gray-1)"
                : undefined,
          }}
          wrap="nowrap"
        >
          <Group gap="sm" style={{ minWidth: 0 }} wrap="nowrap">
            <CustomAvatar
              avatarUrl={verifier.avatarUrl}
              name={verifier.name}
              size={28}
            />
            <div style={{ minWidth: 0 }}>
              <Text size="sm" truncate="end">
                {verifier.name}
              </Text>
              {verifier.email && (
                <Text c="dimmed" size="xs" truncate="end">
                  {verifier.email}
                </Text>
              )}
            </div>
          </Group>
          {canManage && onRemove && (
            <Tooltip label={t("Remove")} withArrow>
              <ActionIcon
                color="gray"
                onClick={() => onRemove(verifier.id)}
                size="sm"
                variant="subtle"
              >
                <IconX size={14} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      ))}
    </>
  );
}
