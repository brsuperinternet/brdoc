import {
  Button,
  Card,
  Group,
  rem,
  SimpleGrid,
  Text,
  Title,
} from "@mantine/core";
import { IconArrowRight } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { CustomAvatar } from "@/components/ui/custom-avatar.tsx";
import { AvatarIconType } from "@/features/attachments/types/attachment.types.ts";
import StarButton from "@/features/favorite/components/star-button";
import { useFavoriteIds } from "@/features/favorite/queries/favorite-query";
import {
  prefetchSpace,
  useGetSpacesQuery,
} from "@/features/space/queries/space-query.ts";
import { formatMemberCount } from "@/lib";
import { getSpaceUrl } from "@/lib/config.ts";
import classes from "./space-grid.module.css";

export default function SpaceGrid() {
  const { t } = useTranslation();
  const { data, isLoading } = useGetSpacesQuery({ limit: 10 });
  const spaceFavoriteIds = useFavoriteIds("space");

  const cards = data?.items.slice(0, 6).map((space, index) => (
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
      <Card.Section className={classes.cardSection} h={40}>
        <div
          className={classes.starButton}
          data-favorited={spaceFavoriteIds.has(space.id)}
        >
          <StarButton
            name={space.name}
            size={16}
            spaceId={space.id}
            type="space"
          />
        </div>
      </Card.Section>
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

      <SimpleGrid cols={{ base: 1, sm: 3, xs: 2 }}>{cards}</SimpleGrid>

      {data?.items && data.items.length > 6 && (
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
