import { Divider, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";

type SpaceSecuritySettingsProps = {
  readOnly?: boolean;
};

export default function SpaceSecuritySettings({
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

      <Divider my="lg" />
    </div>
  );
}
