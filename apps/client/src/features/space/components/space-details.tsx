import { Button, Divider, Text, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import AvatarUploader from "@/components/common/avatar-uploader.tsx";
import ExportModal from "@/components/common/export-modal.tsx";
import {
  ResponsiveSettingsContent,
  ResponsiveSettingsControl,
  ResponsiveSettingsRow,
} from "@/components/ui/responsive-settings-row.tsx";
import {
  removeSpaceIcon,
  uploadSpaceIcon,
} from "@/features/attachments/services/attachment-service.ts";
import { AvatarIconType } from "@/features/attachments/types/attachment.types.ts";
import { EditSpaceForm } from "@/features/space/components/edit-space-form.tsx";
import { useSpaceQuery } from "@/features/space/queries/space-query.ts";
import { queryClient } from "@/main.tsx";
import DeleteSpaceModal from "./delete-space-modal";

interface SpaceDetailsProps {
  readOnly?: boolean;
  spaceId: string;
}
export default function SpaceDetails({ spaceId, readOnly }: SpaceDetailsProps) {
  const { t } = useTranslation();
  const { data: space, isLoading, refetch } = useSpaceQuery(spaceId);
  const [exportOpened, { open: openExportModal, close: closeExportModal }] =
    useDisclosure(false);
  const [isIconUploading, setIsIconUploading] = useState(false);

  const handleIconUpload = async (file: File) => {
    setIsIconUploading(true);
    try {
      await uploadSpaceIcon(file, spaceId);
      await refetch();
      await queryClient.invalidateQueries({
        predicate: (item) => ["spaces"].includes(item.queryKey[0] as string),
      });
    } catch (err) {
      // skip
    } finally {
      setIsIconUploading(false);
    }
  };

  const handleIconRemove = async () => {
    setIsIconUploading(true);
    try {
      await removeSpaceIcon(spaceId);
      await refetch();
      await queryClient.invalidateQueries({
        predicate: (item) => ["spaces"].includes(item.queryKey[0] as string),
      });
    } catch (err) {
      // skip
    } finally {
      setIsIconUploading(false);
    }
  };

  return (
    <>
      {space && (
        <div>
          <Title fw={600} my="md" order={3} size="h6">
            {t("Details")}
          </Title>

          <div style={{ marginBottom: "20px" }}>
            <Text fw={500} mb="xs" size="sm">
              {t("Icon")}
            </Text>
            <AvatarUploader
              currentImageUrl={space.logo}
              disabled={readOnly}
              fallbackName={space.name}
              isLoading={isIconUploading}
              onRemove={handleIconRemove}
              onUpload={handleIconUpload}
              size={"60px"}
              type={AvatarIconType.SPACE_ICON}
              variant="filled"
            />
          </div>

          <EditSpaceForm readOnly={readOnly} space={space} />

          {!readOnly && (
            <>
              <Divider my="lg" />

              <ResponsiveSettingsRow>
                <ResponsiveSettingsContent>
                  <Text size="md">{t("Export space")}</Text>
                  <Text c="dimmed" size="sm">
                    {t("Export all pages and attachments in this space.")}
                  </Text>
                </ResponsiveSettingsContent>
                <ResponsiveSettingsControl>
                  <Button onClick={openExportModal}>{t("Export")}</Button>
                </ResponsiveSettingsControl>
              </ResponsiveSettingsRow>

              <Divider my="lg" />

              <ResponsiveSettingsRow>
                <ResponsiveSettingsContent>
                  <Text size="md">{t("Delete space")}</Text>
                  <Text c="dimmed" size="sm">
                    {t("Delete this space with all its pages and data.")}
                  </Text>
                </ResponsiveSettingsContent>
                <ResponsiveSettingsControl>
                  <DeleteSpaceModal space={space} />
                </ResponsiveSettingsControl>
              </ResponsiveSettingsRow>

              <ExportModal
                id={space.id}
                onClose={closeExportModal}
                open={exportOpened}
                type="space"
              />
            </>
          )}
        </div>
      )}
    </>
  );
}
