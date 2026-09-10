import { Divider, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";
import SpacePublicSharingToggle from "@/ee/security/components/space-public-sharing-toggle.tsx";
import SpaceViewerCommentsToggle from "@/ee/security/components/space-viewer-comments-toggle.tsx";
import { ISpace } from "@/features/space/types/space.types.ts";

type SpaceSecuritySettingsProps = {
  space: ISpace;
  readOnly?: boolean;
};

export default function SpaceSecuritySettings({
  space,
  readOnly,
}: SpaceSecuritySettingsProps) {
  const { t } = useTranslation();

  if (readOnly) {
    return null;
  }

  return (
    <div>
      <Title fw={600} my="md" order={3} size="h6">
        {t("Security")}
      </Title>

      <SpacePublicSharingToggle space={space} />

      <Divider my="lg" />

      <SpaceViewerCommentsToggle space={space} />
    </div>
  );
}
