import { Button, Popover, Text, Tooltip } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconChevronDown, IconChevronUp, IconWorld } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { CustomAvatar } from "@/components/ui/custom-avatar.tsx";
import { AvatarIconType } from "@/features/attachments/types/attachment.types.ts";
import { getSpaceUrl } from "@/lib/config";
import { SpaceSelect } from "./space-select";
import classes from "./switch-space.module.css";

interface SwitchSpaceProps {
  isPublished?: boolean;
  spaceIcon?: string;
  spaceName: string;
  spaceSlug: string;
}

export function SwitchSpace({
  spaceName,
  spaceSlug,
  spaceIcon,
  isPublished,
}: SwitchSpaceProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [opened, { close, toggle }] = useDisclosure(false);

  const handleSelect = (value: string) => {
    if (value) {
      navigate(getSpaceUrl(value));
      close();
    }
  };

  return (
    <Popover
      onChange={toggle}
      opened={opened}
      position="bottom"
      returnFocus
      shadow="md"
      trapFocus
      width={300}
      withArrow
    >
      <Popover.Target>
        <Button
          color="gray"
          fullWidth
          justify="space-between"
          onClick={toggle}
          rightSection={
            opened ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />
          }
          variant="subtle"
        >
          <CustomAvatar
            avatarUrl={spaceIcon}
            color="initials"
            name={spaceName}
            size={20}
            type={AvatarIconType.SPACE_ICON}
            variant="filled"
          />
          <Text className={classes.spaceName} fw={500} lineClamp={1} size="md">
            {spaceName}
          </Text>

          {isPublished && (
            <Tooltip label={t("This space is public")}>
              <IconWorld
                aria-label={t("This space is public")}
                size={14}
                style={{ flexShrink: 0 }}
              />
            </Tooltip>
          )}
        </Button>
      </Popover.Target>
      <Popover.Dropdown>
        <SpaceSelect
          label={spaceName}
          onChange={(space) => handleSelect(space.slug)}
          opened={true}
          value={spaceSlug}
          width={300}
          withinPortal={false}
        />
      </Popover.Dropdown>
    </Popover>
  );
}
