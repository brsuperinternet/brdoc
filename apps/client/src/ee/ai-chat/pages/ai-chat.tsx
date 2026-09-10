import { Button } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";
import { ErrorBoundary } from "react-error-boundary";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { EmptyState } from "@/components/ui/empty-state.tsx";
import AiChatLayout from "../components/ai-chat-layout";
import classes from "../styles/ai-chat.module.css";

export default function AiChat() {
  const { t } = useTranslation();
  const { chatId } = useParams<{ chatId: string }>();

  return (
    <div className={classes.layout}>
      <ErrorBoundary
        fallbackRender={({ resetErrorBoundary }) => (
          <EmptyState
            action={
              <Button
                mt="xs"
                onClick={resetErrorBoundary}
                size="sm"
                variant="default"
              >
                {t("Try again")}
              </Button>
            }
            icon={IconAlertTriangle}
            title={t("Failed to load chat. An error occurred.")}
          />
        )}
        resetKeys={[chatId]}
      >
        <AiChatLayout />
      </ErrorBoundary>
    </div>
  );
}
