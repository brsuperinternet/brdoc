import { markdownToHtml } from "@docmost/editor-ext";
import { Box, Group, Loader, Paper, Stack, Text } from "@mantine/core";
import { IconFileText, IconSparkles } from "@tabler/icons-react";
import DOMPurify from "dompurify";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { buildPageUrl } from "@/features/page/page.utils.ts";
import { IAiSearchResponse } from "../services/ai-search-service.ts";

interface AiSearchResultProps {
  isLoading?: boolean;
  result?: IAiSearchResponse;
  streamingAnswer?: string;
  streamingSources?: any[];
}

export function AiSearchResult({
  result,
  isLoading,
  streamingAnswer = "",
  streamingSources = [],
}: AiSearchResultProps) {
  const { t } = useTranslation();

  // Use streaming data if available, otherwise fall back to result
  const answer = streamingAnswer || result?.answer || "";
  const sources =
    streamingSources.length > 0 ? streamingSources : result?.sources || [];

  // Deduplicate sources by pageId, keeping the one with highest similarity
  const deduplicatedSources = useMemo(() => {
    if (!sources || sources.length === 0) {
      return [];
    }

    const pageMap = new Map();
    sources.forEach((source) => {
      const existing = pageMap.get(source.pageId);
      if (!existing || source.similarity > existing.similarity) {
        pageMap.set(source.pageId, source);
      }
    });

    return Array.from(pageMap.values());
  }, [sources]);

  if (isLoading && !answer) {
    return (
      <Paper p="md" radius="md" withBorder>
        <Group>
          <Loader size="sm" />
          <Text size="sm">{t("AI is thinking...")}</Text>
        </Group>
      </Paper>
    );
  }

  if (!(answer || isLoading)) {
    return null;
  }

  return (
    <Stack gap="md" p="md">
      <Paper p="md" radius="md" withBorder>
        <Group gap="xs" mb="sm">
          <IconSparkles color="var(--mantine-color-blue-6)" size={20} />
          <Text fw={600} size="sm">
            {t("AI Answer")}
          </Text>
          {isLoading && <Loader size="xs" />}
        </Group>
        <div
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(markdownToHtml(answer) as string),
          }}
        />
      </Paper>

      {deduplicatedSources.length > 0 && (
        <Stack gap="xs">
          <Text c="dimmed" fw={600} size="xs">
            {t("Sources")}
          </Text>
          {deduplicatedSources.map((source) => (
            <Box
              component={Link}
              key={source.pageId}
              style={{
                color: "inherit",
                display: "block",
                textDecoration: "none",
              }}
              to={buildPageUrl(source.spaceSlug, source.slugId, source.title)}
            >
              <Paper
                p="xs"
                radius="sm"
                style={{ cursor: "pointer" }}
                withBorder
              >
                <Group gap="xs">
                  <IconFileText size={16} />
                  <Text size="sm" truncate>
                    {source.title}
                  </Text>
                </Group>
              </Paper>
            </Box>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
