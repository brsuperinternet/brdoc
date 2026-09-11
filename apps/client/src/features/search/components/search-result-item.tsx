import { Badge, Center, Group, Text } from "@mantine/core";
import { Spotlight } from "@mantine/spotlight";
import DOMPurify from "dompurify";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { buildPageUrl } from "@/features/page/page.utils";
import {
  IAttachmentSearch,
  IPageSearch,
} from "@/features/search/types/search.types";
import { getPageIcon } from "@/lib";
import { timeAgo } from "@/lib/time.ts";

interface SearchResultItemProps {
  result: IPageSearch | IAttachmentSearch;
  showSpace?: boolean;
}

// Spotlight hardcodes tabIndex={-1} after spreading props; a ref wins and
// React never writes -1 back because the prop value never changes
const makeActionTabbable = (el: HTMLElement | null) => {
  if (el) {
    el.tabIndex = 0;
  }
};

export function SearchResultItem({ result, showSpace }: SearchResultItemProps) {
  const { t } = useTranslation();

  const pageResult = result as IPageSearch;
  return (
    <Spotlight.Action
      component={Link}
      ref={makeActionTabbable}
      style={{ userSelect: "none" }}
      //@ts-expect-error
      to={buildPageUrl(
        pageResult.space.slug,
        pageResult.slugId,
        pageResult.title,
        undefined,
        pageResult.matchedText,
        pageResult.wholeWord
      )}
    >
      <Group w="100%" wrap="nowrap">
        <Center>{getPageIcon(pageResult?.icon)}</Center>

        <div style={{ flex: 1, minWidth: 0 }}>
          <Group gap="xs" justify="space-between" wrap="nowrap">
            <Text truncate>{pageResult.title || t("Untitled")}</Text>
            <Text c="dimmed" size="xs" style={{ flexShrink: 0 }}>
              {timeAgo(pageResult.updatedAt)}
            </Text>
          </Group>

          {showSpace && pageResult.space && (
            <Badge color="gray" size="xs" variant="light">
              {pageResult.space.name}
            </Badge>
          )}

          {pageResult?.highlight && (
            <Text
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(pageResult.highlight, {
                  ALLOWED_ATTR: [],
                  ALLOWED_TAGS: ["mark", "em", "strong", "b"],
                }),
              }}
              opacity={0.6}
              size="xs"
            />
          )}
        </div>
      </Group>
    </Spotlight.Action>
  );
}
