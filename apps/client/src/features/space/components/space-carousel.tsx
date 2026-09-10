import { Button, Card, Group, rem, Skeleton, Text, Title } from "@mantine/core";
import { IconArrowRight } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import CardCarousel from "@/components/ui/card-carousel";
import { CustomAvatar } from "@/components/ui/custom-avatar.tsx";
import { AvatarIconType } from "@/features/attachments/types/attachment.types.ts";
import {
  prefetchSpace,
  useGetSpacesQuery,
} from "@/features/space/queries/space-query.ts";
import { formatMemberCount } from "@/lib";
import { getSpaceUrl } from "@/lib/config.ts";
import classes from "./space-carousel.module.css";

function SpaceCardSkeleton() {
  return (
    <Card className={classes.card} p="xs" radius="md" withBorder>
      <Card.Section className={classes.cardSection} h={40} />
      <Skeleton circle height={38} mt={rem(-20)} width={38} />
      <Skeleton height={14} mt="xs" radius="xl" width="70%" />
      <Skeleton height={10} mt="md" radius="xl" width="40%" />
    </Card>
  );
}

export default function SpaceCarousel() {
  const { t } = useTranslation();
  const { data, isPending } = useGetSpacesQuery({ limit: 20 });

  if (isPending) {
    return (
      <>
        <Group align="center" justify="space-between" mb="md">
          <Title fw={500} order={2} size="h6">
            {t("Spaces you belong to")}
          </Title>
        </Group>
        <CardCarousel ariaLabel={t("Spaces you belong to")}>
          {Array.from({ length: 4 }, (_, i) => (
            <SpaceCardSkeleton key={i} />
          ))}
        </CardCarousel>
      </>
    );
  }

  const cards = data?.items.map((space) => (
    <Card
      className={classes.card}
      component={Link}
      key={space.id}
      onMouseEnter={() => prefetchSpace(space.slug, space.id)}
      p="xs"
      radius="md"
      to={getSpaceUrl(space.slug)}
      withBorder
    >
      <Card.Section className={classes.cardSection} h={40} />
      <CustomAvatar
        avatarUrl={space.logo}
        color="initials"
        mt={rem(-20)}
        name={space.name}
        size="md"
        type={AvatarIconType.SPACE_ICON}
        variant="filled"
      />

      <Text className={classes.title} fw={500} fz="md" mt="xs">
        {space.name}
      </Text>

      <Text c="dimmed" fw={700} mt="md" size="xs">
        {formatMemberCount(space.memberCount, t)}
      </Text>
    </Card>
  ));

  return (
    <>
      <Group align="center" justify="space-between" mb="md">
        <Title fw={500} order={2} size="h6">
          {t("Spaces you belong to")}
        </Title>
      </Group>

      <CardCarousel ariaLabel={t("Spaces you belong to")}>{cards}</CardCarousel>

      {data?.items && data.items.length > 1 && (
        <Group justify="flex-end" mt="lg">
          <Button
            component={Link}
            rightSection={<IconArrowRight size={16} />}
            size="sm"
            to="/spaces"
            variant="subtle"
          >
            {t("View all spaces")}
          </Button>
        </Group>
      )}
    </>
  );
}
