import { Text } from "@mantine/core";
import { useAtom } from "jotai";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import AvatarUploader from "@/components/common/avatar-uploader.tsx";
import {
  removeWorkspaceIcon,
  uploadWorkspaceIcon,
} from "@/features/attachments/services/attachment-service.ts";
import { AvatarIconType } from "@/features/attachments/types/attachment.types.ts";
import { workspaceAtom } from "@/features/user/atoms/current-user-atom.ts";
import useUserRole from "@/hooks/use-user-role.tsx";

export default function WorkspaceIcon() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [workspace, setWorkspace] = useAtom(workspaceAtom);
  const { isAdmin } = useUserRole();

  const handleIconUpload = async (file: File) => {
    setIsLoading(true);
    try {
      const result = await uploadWorkspaceIcon(file);
      if (workspace) {
        setWorkspace({ ...workspace, logo: result.fileName });
      }
    } catch (error) {
      //
    } finally {
      setIsLoading(false);
    }
  };

  const handleIconRemove = async () => {
    setIsLoading(true);
    try {
      await removeWorkspaceIcon();
      if (workspace) {
        setWorkspace({ ...workspace, logo: null });
      }
    } catch (error) {
      //
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: "24px" }}>
      <Text fw={500} mb="xs" size="sm">
        {t("Icon")}
      </Text>
      <AvatarUploader
        currentImageUrl={workspace?.logo}
        disabled={!isAdmin}
        fallbackName={workspace?.name}
        isLoading={isLoading}
        onRemove={handleIconRemove}
        onUpload={handleIconUpload}
        radius="sm"
        size="60px"
        type={AvatarIconType.WORKSPACE_ICON}
        variant="filled"
      />
    </div>
  );
}
