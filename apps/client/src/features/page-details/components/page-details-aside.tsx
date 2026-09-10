import {
  Divider,
  Group,
  Skeleton,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconChevronRight } from "@tabler/icons-react";
import { useAtomValue } from "jotai";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { CustomAvatar } from "@/components/ui/custom-avatar.tsx";
import { pageEditorAtom } from "@/features/editor/atoms/editor-atoms.ts";
import { LabelsSection } from "@/features/label/components/labels-section.tsx";
import { usePageQuery } from "@/features/page/queries/page-query.ts";
import { useBacklinksCountQuery } from "@/features/page-details/queries/backlinks-query.ts";
import { useTimeAgo } from "@/hooks/use-time-ago.tsx";
import { extractPageSlugId } from "@/lib";
import { formattedDate } from "@/lib/time.ts";
import { BacklinksModal } from "./backlinks-modal";

export function PageDetailsAside() {
  const { pageSlug } = useParams();
  const { data: page } = usePageQuery({
    pageId: extractPageSlugId(pageSlug),
  });
  const pageEditor = useAtomValue(pageEditorAtom);
  const { data: counts, isLoading: countsLoading } = useBacklinksCountQuery(
    page?.id
  );
  const [modalOpened, { open: openModal, close: closeModal }] =
    useDisclosure(false);

  if (!page) {
    return null;
  }

  const wordCount: number = pageEditor?.storage?.characterCount?.words?.() ?? 0;
  const characterCount: number =
    pageEditor?.storage?.characterCount?.characters?.() ?? 0;

  return (
    <>
      <Stack gap="md">
        <PeopleSection
          creator={page.creator}
          lastUpdatedBy={page.lastUpdatedBy}
        />

        <Divider />

        <StatsSection
          characterCount={characterCount}
          createdAt={page.createdAt}
          updatedAt={page.updatedAt}
          wordCount={wordCount}
        />

        <Divider />

        <BacklinksSection
          incomingCount={counts?.incoming ?? 0}
          isLoading={countsLoading}
          onClick={openModal}
          outgoingCount={counts?.outgoing ?? 0}
        />

        <LabelsSection
          canEdit={page.permissions?.canEdit ?? false}
          pageId={page.id}
        />
      </Stack>

      <BacklinksModal
        onClose={closeModal}
        opened={modalOpened}
        pageId={page.id}
      />
    </>
  );
}

function PeopleSection({
  creator,
  lastUpdatedBy,
}: {
  creator: { id: string; name: string; avatarUrl: string } | null;
  lastUpdatedBy: { id: string; name: string; avatarUrl: string } | null;
}) {
  const { t } = useTranslation();
  return (
    <Stack gap="xs">
      <PersonRow label={t("Created by")} person={creator} />
      <PersonRow label={t("Last updated by")} person={lastUpdatedBy} />
    </Stack>
  );
}

function PersonRow({
  label,
  person,
}: {
  label: string;
  person: { id: string; name: string; avatarUrl: string } | null;
}) {
  return (
    <Group justify="space-between" wrap="nowrap">
      <Text c="dimmed" size="sm">
        {label}
      </Text>
      {person ? (
        <Group gap={6} wrap="nowrap">
          <CustomAvatar
            avatarUrl={person.avatarUrl}
            name={person.name}
            radius="xl"
            size={20}
          />
          <Text lineClamp={1} size="sm">
            {person.name}
          </Text>
        </Group>
      ) : (
        <Text c="dimmed" size="sm">
          —
        </Text>
      )}
    </Group>
  );
}

function StatsSection({
  wordCount,
  characterCount,
  createdAt,
  updatedAt,
}: {
  wordCount: number;
  characterCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}) {
  const { t } = useTranslation();
  const lastUpdated = useTimeAgo(updatedAt);
  return (
    <Stack gap="xs">
      <Text c="dimmed" fw={500} size="xs">
        {t("Stats")}
      </Text>
      <StatRow label={t("Word count")} value={String(wordCount)} />
      <StatRow label={t("Characters")} value={String(characterCount)} />
      <StatRow
        label={t("Created")}
        value={formattedDate(new Date(createdAt))}
      />
      <StatRow label={t("Last updated")} value={lastUpdated} />
    </Stack>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <Group justify="space-between" wrap="nowrap">
      <Text c="dimmed" size="sm">
        {label}
      </Text>
      <Text size="sm">{value}</Text>
    </Group>
  );
}

function BacklinksSection({
  incomingCount,
  outgoingCount,
  isLoading,
  onClick,
}: {
  incomingCount: number;
  outgoingCount: number;
  isLoading: boolean;
  onClick: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Stack gap="xs">
      <Text c="dimmed" fw={500} size="xs">
        {t("Backlinks")}
      </Text>
      <BacklinksRow
        count={incomingCount}
        isLoading={isLoading}
        label={t("Incoming links")}
        onClick={onClick}
      />
      <BacklinksRow
        count={outgoingCount}
        isLoading={isLoading}
        label={t("Outgoing links")}
        onClick={onClick}
      />
    </Stack>
  );
}

function BacklinksRow({
  label,
  count,
  isLoading,
  onClick,
}: {
  label: string;
  count: number;
  isLoading: boolean;
  onClick: () => void;
}) {
  return (
    <UnstyledButton
      onClick={onClick}
      style={{
        borderRadius: 4,
        padding: "4px 4px",
      }}
    >
      <Group justify="space-between" wrap="nowrap">
        <Text c="dimmed" size="sm">
          {label}
        </Text>
        <Group gap={6} wrap="nowrap">
          {isLoading ? (
            <Skeleton height={18} width={20} />
          ) : (
            <Text size="sm">{count}</Text>
          )}
          <IconChevronRight
            color="var(--mantine-color-dimmed)"
            size={16}
            stroke={2}
          />
        </Group>
      </Group>
    </UnstyledButton>
  );
}
