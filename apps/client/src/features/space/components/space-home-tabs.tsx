import { Space, Tabs, Text } from "@mantine/core";
import { IconClockHour3, IconStar, IconUser } from "@tabler/icons-react";
import { useAtom } from "jotai";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import RecentChanges from "@/components/common/recent-changes";
import { homeTabAtom } from "@/features/home/atoms/home-tab-atom";
import CreatedByMe from "@/features/home/components/created-by-me";
import FavoritesPages from "@/features/home/components/favorites-pages";
import { useGetSpaceBySlugQuery } from "@/features/space/queries/space-query";

export default function SpaceHomeTabs() {
  const { t } = useTranslation();
  const { spaceSlug } = useParams();
  const { data: space } = useGetSpaceBySlugQuery(spaceSlug);
  const [activeTab, setActiveTab] = useAtom(homeTabAtom);

  return (
    <Tabs
      color="dark"
      onChange={(value) => {
        if (value) {
          setActiveTab(value);
        }
      }}
      value={activeTab}
    >
      <Tabs.List style={{ flexWrap: "nowrap", overflowX: "auto" }}>
        <Tabs.Tab leftSection={<IconClockHour3 size={18} />} value="recent">
          <Text fw={500} size="sm">
            {t("Recently updated")}
          </Text>
        </Tabs.Tab>
        <Tabs.Tab leftSection={<IconStar size={18} />} value="favorites">
          <Text fw={500} size="sm">
            {t("Favorites")}
          </Text>
        </Tabs.Tab>
        <Tabs.Tab leftSection={<IconUser size={18} />} value="created">
          <Text fw={500} size="sm">
            {t("Created by me")}
          </Text>
        </Tabs.Tab>
      </Tabs.List>

      <Space my="md" />

      <Tabs.Panel value="recent">
        {space?.id && <RecentChanges spaceId={space.id} />}
      </Tabs.Panel>
      <Tabs.Panel value="favorites">
        {space?.id && <FavoritesPages spaceId={space.id} />}
      </Tabs.Panel>
      <Tabs.Panel value="created">
        {space?.id && <CreatedByMe spaceId={space.id} />}
      </Tabs.Panel>
    </Tabs>
  );
}
