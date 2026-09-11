import {
  Box,
  Button,
  Card,
  Group,
  rem,
  SimpleGrid,
  Text,
  Title,
} from "@mantine/core";
import { IconChevronDown } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { CustomAvatar } from "@/components/ui/custom-avatar";
import { AvatarIconType } from "@/features/attachments/types/attachment.types";
import StarButton from "@/features/favorite/components/star-button";
import { useFavoritesQuery } from "@/features/favorite/queries/favorite-query";
import { prefetchSpace } from "@/features/space/queries/space-query";
import { getSpaceUrl } from "@/lib/config";
import spaceClasses from "../space-grid.module.css";

const INITIAL_COUNT = 8;

export default function FavoriteSpacesGrid() {
  const { t } = useTranslation();
  const { data } = useFavoritesQuery("space");
  const [expanded, setExpanded] = useState(false);

  const allSpaces = (data?.pages.flatMap((p: any) => p.items) ?? [])
    .filter((fav) => fav.space)
    .sort((a, b) => a.space?.name.localeCompare(b.space?.name));

  if (allSpaces.length === 0) {
    return null;
  }

  const visibleSpaces = expanded
    ? allSpaces
    : allSpaces.slice(0, INITIAL_COUNT);

  return (
    <Box mb="xl">
      <Title fw={500} mb="md" order={2} size="h6">
        {t("Favorite spaces")}
      </Title>

      <SimpleGrid cols={{ base: 1, sm: 4, xs: 2 }}>
        {visibleSpaces.map((fav) => (
          <Card
            className={spaceClasses.card}
            component={Link}
            key={fav.id}
            onMouseEnter={() => prefetchSpace(fav.space?.slug, fav.space?.id)}
            p="xs"
            radius="md"
            to={getSpaceUrl(fav.space?.slug)}
            withBorder
          >
            <Card.Section className={spaceClasses.cardSection} h={40}>
              <div className={spaceClasses.starButton} data-favorited="true">
                <StarButton
                  name={fav.space?.name}
                  size={16}
                  spaceId={fav.space?.id}
                  type="space"
                />
              </div>
            </Card.Section>
            <CustomAvatar
              avatarUrl={fav.space?.logo}
              color="initials"
              mt={rem(-20)}
              name={fav.space?.name}
              size="md"
              type={AvatarIconType.SPACE_ICON}
              variant="filled"
            />
            <Text className={spaceClasses.title} fw={500} fz="md" mt="xs">
              {fav.space?.name}
            </Text>
          </Card>
        ))}
      </SimpleGrid>

      {!expanded && allSpaces.length > INITIAL_COUNT && (
        <Group justify="center" mt="sm">
          <Button
            onClick={() => setExpanded(true)}
            rightSection={<IconChevronDown size={14} />}
            size="xs"
            variant="subtle"
          >
            {t("Show more")}
          </Button>
        </Group>
      )}
    </Box>
  );
}
