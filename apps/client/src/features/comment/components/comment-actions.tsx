import { Button, Group } from "@mantine/core";
import { useTranslation } from "react-i18next";

type CommentActionsProps = {
  onSave: () => void;
  isLoading?: boolean;
  onCancel?: () => void;
  isCommentEditor?: boolean;
};

function CommentActions({
  onSave,
  isLoading,
  onCancel,
  isCommentEditor,
}: CommentActionsProps) {
  const { t } = useTranslation();

  return (
    <Group justify="flex-end" pt="sm" wrap="nowrap">
      {isCommentEditor && (
        <Button onClick={onCancel} size="compact-sm" variant="default">
          {t("Cancel")}
        </Button>
      )}

      <Button
        loading={isLoading}
        onClick={onSave}
        onMouseDown={(e) => e.preventDefault()}
        size="compact-sm"
      >
        {t("Save")}
      </Button>
    </Group>
  );
}

export default CommentActions;
