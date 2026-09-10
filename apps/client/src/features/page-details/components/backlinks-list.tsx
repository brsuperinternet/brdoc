import {
  Button,
  Center,
  Group,
  Loader,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { buildPageUrl, getPageTitle } from "@/features/page/page.utils.ts";
import { useBacklinksQuery } from "@/features/page-details/queries/backlinks-query.ts";
import {
  BacklinkDirection,
  IBacklinkPageItem,
} from "@/features/page-details/types/backlink.types.ts";
import { getPageIcon } from "@/lib";

interface BacklinksListProps {
  direction: BacklinkDirection;
  enabled: boolean;
  onItemClick: () => void;
  pageId: string;
}

export function BacklinksList({
  pageId,
  direction,
  enabled,
  onItemClick,
}: BacklinksListProps) {
  const { t } = useTranslation();
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useBacklinksQuery(pageId, direction, enabled);

  if (!enabled) {
    return null;
  }

  if (isLoading) {
    return (
      <Center py="sm">
        <Loader size="sm" />
      </Center>
    );
  }

  const items: IBacklinkPageItem[] =
    data?.pages.flatMap((page) => page.items) ?? [];

  if (items.length === 0) {
    return (
      <Text c="dimmed" py="md" size="sm">
        {direction === "incoming"
          ? t("No pages link here yet.")
          : t("This page doesn't link to other pages yet.")}
      </Text>
    );
  }

  const handleClick = (e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) {
      return;
    }
    onItemClick();
  };

  return (
    <Stack gap={4}>
      {items.map((item) => (
        <UnstyledButton
          component={Link}
          key={item.id}
          onClick={handleClick}
          style={{ borderRadius: 4, padding: "8px 4px", userSelect: "none" }}
          to={
            item.space?.slug
              ? buildPageUrl(
                  item.space.slug,
                  item.slugId,
                  item.title ?? undefined
                )
              : "#"
          }
        >
          <Group gap="xs" wrap="nowrap">
            {getPageIcon(item.icon ?? "")}
            <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
              <Text fw={500} lineClamp={1} size="sm">
                {getPageTitle(item.title, undefined, t)}
              </Text>
              {item.space?.name && (
                <Text c="dimmed" lineClamp={1} size="xs">
                  {item.space.name}
                </Text>
              )}
            </Stack>
          </Group>
        </UnstyledButton>
      ))}
      {hasNextPage && (
        <Button
          loading={isFetchingNextPage}
          mt="xs"
          onClick={() => fetchNextPage()}
          size="xs"
          variant="subtle"
        >
          {t("Load more")}
        </Button>
      )}
    </Stack>
  );
}
