import { ActionIcon, Button, Card, Group, Menu, Text } from "@mantine/core";
import {
  IconDots,
  IconEdit,
  IconFileText,
  IconTrash,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { ITemplate } from "@/ee/template/types/template.types";
import classes from "./template-card.module.css";

type TemplateCardProps = {
  template: ITemplate;
  spaceName?: string;
  onPreview: (template: ITemplate) => void;
  onUse: (template: ITemplate) => void;
  onEdit?: (template: ITemplate) => void;
  onDelete?: (template: ITemplate) => void;
  canManage?: boolean;
};

export default function TemplateCard({
  template,
  spaceName,
  onPreview,
  onUse,
  onEdit,
  onDelete,
  canManage,
}: TemplateCardProps) {
  const { t } = useTranslation();

  return (
    <Card
      aria-label={t("Preview template: {{title}}", { title: template.title })}
      className={classes.card}
      onClick={() => onPreview(template)}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) {
          return;
        }
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onPreview(template);
        }
      }}
      padding="lg"
      radius="md"
      role="button"
      style={{ cursor: "pointer" }}
      tabIndex={0}
    >
      <div className={classes.cardBody}>
        <Group align="flex-start" justify="space-between" mb="md" wrap="nowrap">
          {template.icon ? (
            <div className={classes.icon}>{template.icon}</div>
          ) : (
            <div className={classes.iconFallback}>
              <IconFileText size={20} stroke={1.5} />
            </div>
          )}

          <Group gap={6} wrap="nowrap">
            <Button
              className={classes.menuTarget}
              onClick={(e) => {
                e.stopPropagation();
                onUse(template);
              }}
              size="compact-xs"
              variant="filled"
            >
              {t("Use")}
            </Button>
            {canManage && (
              <Menu shadow="md" width={150} withArrow>
                <Menu.Target>
                  <ActionIcon
                    aria-label={t("Template menu")}
                    className={classes.menuTarget}
                    color="gray"
                    onClick={(e) => e.stopPropagation()}
                    size="sm"
                    variant="subtle"
                  >
                    <IconDots size={16} />
                  </ActionIcon>
                </Menu.Target>

                <Menu.Dropdown>
                  <Menu.Item
                    leftSection={<IconEdit size={14} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit?.(template);
                    }}
                  >
                    {t("Edit")}
                  </Menu.Item>
                  <Menu.Item
                    color="red"
                    leftSection={<IconTrash size={14} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.(template);
                    }}
                  >
                    {t("Delete")}
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            )}
          </Group>
        </Group>

        <div className={classes.title}>{template.title}</div>

        <div className={classes.footer}>
          <span aria-hidden="true" className={classes.scopeDot} />
          <Text c="dimmed" fw={500} size="sm">
            {template.spaceId ? spaceName || t("Space") : t("Global")}
          </Text>
        </div>
      </div>
    </Card>
  );
}
