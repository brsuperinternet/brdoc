import { Box, Loader, Menu } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconTrash, IconUpload } from "@tabler/icons-react";
import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import { CustomAvatar } from "@/components/ui/custom-avatar.tsx";
import { AvatarIconType } from "@/features/attachments/types/attachment.types.ts";

interface AvatarUploaderProps {
  currentImageUrl?: string | null;
  disabled?: boolean;
  fallbackName?: string;
  isLoading?: boolean;
  onRemove: () => Promise<void>;
  onUpload: (file: File) => Promise<void>;
  radius?: string | number;
  size?: string | number;
  type: AvatarIconType;
  variant?: string;
}

export default function AvatarUploader({
  currentImageUrl,
  fallbackName,
  radius,
  variant,
  size,
  type,
  onUpload,
  onRemove,
  isLoading = false,
  disabled = false,
}: AvatarUploaderProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileInputChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || disabled) {
      return;
    }

    // Validate file size (max 10MB)
    const maxSizeInBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      notifications.show({
        color: "red",
        message: t("Image exceeds 10MB limit."),
      });
      // Reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    try {
      await onUpload(file);
    } catch (error) {
      console.error(error);
      notifications.show({
        color: "red",
        message: t("Failed to upload image"),
      });
    }

    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      console.error("File input ref is null!");
    }
  };

  const actionLabel = {
    [AvatarIconType.AVATAR]: t("Change avatar"),
    [AvatarIconType.SPACE_ICON]: t("Change space icon"),
    [AvatarIconType.WORKSPACE_ICON]: t("Change workspace icon"),
  }[type];

  // Per WCAG 2.5.3 (Label in Name), the accessible name must include the
  // visible text. When no image is set, the avatar renders the name's
  // initials, so prepend the name to the action label.
  const ariaLabel =
    !currentImageUrl && fallbackName
      ? `${fallbackName} – ${actionLabel}`
      : actionLabel;

  const handleRemove = async () => {
    if (disabled) {
      return;
    }

    try {
      await onRemove();
      notifications.show({
        message: t("Image removed successfully"),
      });
    } catch (error) {
      console.error(error);
      notifications.show({
        color: "red",
        message: t("Failed to remove image"),
      });
    }
  };

  return (
    <Box>
      <input
        accept="image/png,image/jpeg,image/jpg"
        aria-label={ariaLabel}
        onChange={handleFileInputChange}
        ref={fileInputRef}
        style={{ display: "none" }}
        tabIndex={-1}
        type="file"
      />

      <Menu disabled={disabled || isLoading} shadow="md" width={200} withArrow>
        <Menu.Target>
          <Box style={{ display: "inline-block", position: "relative" }}>
            <CustomAvatar
              aria-haspopup="menu"
              aria-label={ariaLabel}
              avatarUrl={currentImageUrl}
              component="button"
              name={fallbackName}
              radius={radius}
              size={size}
              style={{
                cursor: disabled || isLoading ? "default" : "pointer",
                opacity: isLoading ? 0.6 : 1,
              }}
              type={type}
              variant={variant}
            />
            {isLoading && (
              <Box
                style={{
                  left: "50%",
                  position: "absolute",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  zIndex: 200,
                }}
              >
                <Loader size="sm" />
              </Box>
            )}
          </Box>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Item
            disabled={isLoading || disabled}
            leftSection={<IconUpload size={16} />}
            onClick={handleUploadClick}
          >
            {t("Upload image")}
          </Menu.Item>

          {currentImageUrl && (
            <Menu.Item
              color="red"
              disabled={isLoading || disabled}
              leftSection={<IconTrash size={16} />}
              onClick={handleRemove}
            >
              {t("Remove image")}
            </Menu.Item>
          )}
        </Menu.Dropdown>
      </Menu>
    </Box>
  );
}
