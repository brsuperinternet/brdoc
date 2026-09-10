import { Alert, Anchor, Group, Text } from "@mantine/core";
import { IconExternalLink, IconWorld } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { buildPublicSpaceUrl } from "@/features/page/page.utils.ts";
import { ISpace } from "@/features/space/types/space.types.ts";
import { isBetaPublicSpaces } from "@/lib/config.ts";

type SpacePublicNoticeProps = {
  space: ISpace;
};

export default function SpacePublicNotice({ space }: SpacePublicNoticeProps) {
  const { t } = useTranslation();

  if (!(isBetaPublicSpaces() && space?.isPublished)) {
    return null;
  }

  return (
    <Alert
      color="blue"
      icon={<IconWorld size={18} />}
      mb="lg"
      title={t("This space is public")}
      variant="light"
    >
      <Group gap="xs" justify="space-between">
        <Text size="sm">
          {t(
            "Anyone on the internet can read the pages in this space, except restricted pages."
          )}
        </Text>
        <Anchor
          fw={500}
          href={buildPublicSpaceUrl({ spaceSlug: space.slug })}
          rel="noopener"
          size="sm"
          style={{ alignItems: "center", display: "inline-flex", gap: 4 }}
          target="_blank"
        >
          {t("Open public site")}
          <IconExternalLink size={14} />
        </Anchor>
      </Group>
    </Alert>
  );
}
