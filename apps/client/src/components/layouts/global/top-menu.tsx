import {
  Group,
  Menu,
  Text,
  UnstyledButton,
  useMantineColorScheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconBrightnessFilled,
  IconBrush,
  IconCheck,
  IconChevronDown,
  IconDeviceDesktop,
  IconLogout,
  IconMoon,
  IconSettings,
  IconSun,
  IconUser,
  IconUserCircle,
  IconUsers,
} from "@tabler/icons-react";
import { useAtom } from "jotai";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { CustomAvatar } from "@/components/ui/custom-avatar.tsx";
import { Feature } from "@/ee/features";
import { useHasFeature } from "@/ee/hooks/use-feature";
import CreatePersonalSpaceModal from "@/ee/personal-space/components/create-personal-space-modal";
import { usePersonalSpaceQuery } from "@/ee/personal-space/queries/personal-space-query";
import { AvatarIconType } from "@/features/attachments/types/attachment.types.ts";
import useAuth from "@/features/auth/hooks/use-auth.ts";
import { currentUserAtom } from "@/features/user/atoms/current-user-atom.ts";
import APP_ROUTE from "@/lib/app-route.ts";
import { getSpaceUrl } from "@/lib/config.ts";

export default function TopMenu() {
  const { t } = useTranslation();
  const [currentUser] = useAtom(currentUserAtom);
  const { logout } = useAuth();
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  const user = currentUser?.user;
  const workspace = currentUser?.workspace;

  const hasPersonalSpaces = useHasFeature(Feature.PERSONAL_SPACES);
  const settingEnabled = workspace?.settings?.spaces?.allowPersonal === true;
  const { data: personalSpace } = usePersonalSpaceQuery(hasPersonalSpaces);
  const [createOpened, { open: openCreate, close: closeCreate }] =
    useDisclosure(false);

  if (!(user && workspace)) {
    return <></>;
  }

  return (
    <>
      <Menu position="bottom-end" shadow={"lg"} width={250} withArrow>
        <Menu.Target>
          <UnstyledButton>
            <Group gap={7} wrap={"nowrap"}>
              <CustomAvatar
                avatarUrl={workspace?.logo}
                name={workspace?.name}
                size="sm"
                type={AvatarIconType.WORKSPACE_ICON}
                variant="filled"
              />
              <Text fw={500} lh={1} lineClamp={1} mr={3} size="sm">
                {workspace?.name}
              </Text>
              <IconChevronDown size={16} />
            </Group>
          </UnstyledButton>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Label>{t("Workspace")}</Menu.Label>

          <Menu.Item
            component={Link}
            leftSection={<IconSettings size={16} />}
            to={APP_ROUTE.SETTINGS.WORKSPACE.GENERAL}
          >
            {t("Workspace settings")}
          </Menu.Item>

          <Menu.Item
            component={Link}
            leftSection={<IconUsers size={16} />}
            to={APP_ROUTE.SETTINGS.WORKSPACE.MEMBERS}
          >
            {t("Manage members")}
          </Menu.Item>

          <Menu.Divider />

          <Menu.Label>{t("Account")}</Menu.Label>
          <Menu.Item component={Link} to={APP_ROUTE.SETTINGS.ACCOUNT.PROFILE}>
            <Group wrap={"nowrap"}>
              <CustomAvatar
                avatarUrl={user.avatarUrl}
                name={user.name}
                size={"sm"}
              />

              <div style={{ width: 190 }}>
                <Text fw={500} lineClamp={1} size="sm">
                  {user.name}
                </Text>
                <Text c="dimmed" size="xs" truncate="end">
                  {user.email}
                </Text>
              </div>
            </Group>
          </Menu.Item>
          <Menu.Item
            component={Link}
            leftSection={<IconUserCircle size={16} />}
            to={APP_ROUTE.SETTINGS.ACCOUNT.PROFILE}
          >
            {t("My profile")}
          </Menu.Item>

          <Menu.Item
            component={Link}
            leftSection={<IconBrush size={16} />}
            to={APP_ROUTE.SETTINGS.ACCOUNT.PREFERENCES}
          >
            {t("My preferences")}
          </Menu.Item>

          {personalSpace ? (
            <Menu.Item
              component={Link}
              leftSection={<IconUser size={16} />}
              to={getSpaceUrl(personalSpace.slug)}
            >
              {t("Personal space")}
            </Menu.Item>
          ) : (
            hasPersonalSpaces &&
            settingEnabled && (
              <Menu.Item
                leftSection={<IconUser size={16} />}
                onClick={openCreate}
              >
                {t("Create personal space")}
              </Menu.Item>
            )
          )}

          <Menu.Sub>
            <Menu.Sub.Target>
              <Menu.Sub.Item leftSection={<IconBrightnessFilled size={16} />}>
                {t("Theme")}
              </Menu.Sub.Item>
            </Menu.Sub.Target>

            <Menu.Sub.Dropdown>
              <Menu.Item
                leftSection={<IconSun size={16} />}
                onClick={() => setColorScheme("light")}
                rightSection={
                  colorScheme === "light" ? <IconCheck size={16} /> : null
                }
              >
                {t("Light")}
              </Menu.Item>
              <Menu.Item
                leftSection={<IconMoon size={16} />}
                onClick={() => setColorScheme("dark")}
                rightSection={
                  colorScheme === "dark" ? <IconCheck size={16} /> : null
                }
              >
                {t("Dark")}
              </Menu.Item>
              <Menu.Item
                leftSection={<IconDeviceDesktop size={16} />}
                onClick={() => setColorScheme("auto")}
                rightSection={
                  colorScheme === "auto" ? <IconCheck size={16} /> : null
                }
              >
                {t("System settings")}
              </Menu.Item>
            </Menu.Sub.Dropdown>
          </Menu.Sub>

          <Menu.Divider />

          <Menu.Item leftSection={<IconLogout size={16} />} onClick={logout}>
            {t("Logout")}
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>

      <CreatePersonalSpaceModal onClose={closeCreate} opened={createOpened} />
    </>
  );
}
