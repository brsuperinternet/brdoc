import { Space, Tabs, Text } from "@mantine/core";
import { IconClockHour3, IconStar, IconUser } from "@tabler/icons-react";
import { useAtom } from "jotai";
import { useTranslation } from "react-i18next";
import RecentChanges from "@/components/common/recent-changes";
import { homeTabAtom } from "@/features/home/atoms/home-tab-atom";
import CreatedByMe from "./created-by-me";
import FavoritesPages from "./favorites-pages";

export default function HomeTabs() {
  const { t } = useTranslation();
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
        <RecentChanges />
      </Tabs.Panel>
      <Tabs.Panel value="favorites">
        <FavoritesPages />
      </Tabs.Panel>
      <Tabs.Panel value="created">
        <CreatedByMe />
      </Tabs.Panel>
    </Tabs>
  );
}
