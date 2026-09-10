import { Stack, Switch, Text, Title } from "@mantine/core";
import { useAtom } from "jotai";
import React, { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ResponsiveSettingsContent,
  ResponsiveSettingsControl,
  ResponsiveSettingsRow,
} from "@/components/ui/responsive-settings-row";
import { userAtom } from "@/features/user/atoms/current-user-atom.ts";
import { updateUser } from "@/features/user/services/user-service.ts";
import { IUser, IUserSettings } from "@/features/user/types/user.types.ts";

type NotificationKey = keyof NonNullable<IUserSettings["notifications"]>;

const notificationItems: {
  key: NotificationKey;
  dtoField: keyof IUser;
  label: string;
  description: string;
}[] = [
  {
    description: "Get notified when pages you watch are updated.",
    dtoField: "notificationPageUpdates",
    key: "page.updated",
    label: "Page updates",
  },
  {
    description: "Get notified when someone mentions you on a page.",
    dtoField: "notificationPageUserMention",
    key: "page.userMention",
    label: "Page mentions",
  },
  {
    description: "Get notified when someone mentions you in a comment.",
    dtoField: "notificationCommentUserMention",
    key: "comment.userMention",
    label: "Comment mentions",
  },
  {
    description:
      "Get notified about new comments on threads you participate in.",
    dtoField: "notificationCommentCreated",
    key: "comment.created",
    label: "New comments",
  },
  {
    description: "Get notified when your comment is resolved.",
    dtoField: "notificationCommentResolved",
    key: "comment.resolved",
    label: "Resolved comments",
  },
];

function NotificationToggle({
  settingKey,
  dtoField,
  label,
  description,
}: {
  settingKey: NotificationKey;
  dtoField: keyof IUser;
  label: string;
  description: string;
}) {
  const { t } = useTranslation();
  const switchId = useId();
  const descriptionId = useId();
  const [user, setUser] = useAtom(userAtom);
  const [checked, setChecked] = useState(
    user.settings?.notifications?.[settingKey] !== false
  );

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.currentTarget.checked;
    setChecked(value);
    try {
      const updatedUser = await updateUser({ [dtoField]: value } as any);
      setUser(updatedUser);
    } catch {
      setChecked(!value);
    }
  };

  return (
    <ResponsiveSettingsRow>
      <ResponsiveSettingsContent>
        <Text
          component="label"
          htmlFor={switchId}
          size="md"
          style={{ cursor: "pointer" }}
        >
          {t(label)}
        </Text>
        <Text c="dimmed" id={descriptionId} size="sm">
          {t(description)}
        </Text>
      </ResponsiveSettingsContent>

      <ResponsiveSettingsControl>
        <Switch
          aria-describedby={descriptionId}
          checked={checked}
          id={switchId}
          onChange={handleChange}
        />
      </ResponsiveSettingsControl>
    </ResponsiveSettingsRow>
  );
}

export default function NotificationPref() {
  const { t } = useTranslation();

  return (
    <Stack gap="xs">
      <Title order={2} size="h5">
        {t("Email notifications")}
      </Title>

      {notificationItems.map((item) => (
        <NotificationToggle
          description={item.description}
          dtoField={item.dtoField}
          key={item.key}
          label={item.label}
          settingKey={item.key}
        />
      ))}
    </Stack>
  );
}
