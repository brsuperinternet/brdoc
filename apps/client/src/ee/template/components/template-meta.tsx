import { Group, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { CustomAvatar } from "@/components/ui/custom-avatar";
import { ITemplate } from "@/ee/template/types/template.types";
import { useTimeAgo } from "@/hooks/use-time-ago";

type TemplateMetaProps = {
  template: ITemplate;
};

export default function TemplateMeta({ template }: TemplateMetaProps) {
  const { t } = useTranslation();
  const updatedAtAgo = useTimeAgo(template.updatedAt);

  return (
    <Group gap={8} mt="xs" style={{ cursor: "default" }} wrap="nowrap">
      {template.creator?.name && (
        <>
          <CustomAvatar
            avatarUrl={template.creator.avatarUrl}
            name={template.creator.name}
            radius="xl"
            size={24}
          />
          <Text c="dimmed" fw={500} size="sm">
            {t("By {{name}}", { name: template.creator.name })}
          </Text>
        </>
      )}
      {updatedAtAgo && (
        <Text c="dimmed" size="sm">
          {t("Updated {{time}}", { time: updatedAtAgo })}
        </Text>
      )}
    </Group>
  );
}
