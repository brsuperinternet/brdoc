import { useAtom } from "jotai";
import { useState } from "react";
import AvatarUploader from "@/components/common/avatar-uploader.tsx";
import {
  removeAvatar,
  uploadUserAvatar,
} from "@/features/attachments/services/attachment-service.ts";
import { AvatarIconType } from "@/features/attachments/types/attachment.types.ts";
import {
  currentUserAtom,
  userAtom,
} from "@/features/user/atoms/current-user-atom.ts";

export default function AccountAvatar() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser] = useAtom(currentUserAtom);
  const [, setUser] = useAtom(userAtom);

  const handleUpload = async (selectedFile: File) => {
    setIsLoading(true);
    try {
      const avatar = await uploadUserAvatar(selectedFile);
      if (currentUser?.user) {
        setUser({ ...currentUser.user, avatarUrl: avatar.fileName });
      }
    } catch (err) {
      // skip
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    setIsLoading(true);
    try {
      await removeAvatar();
      if (currentUser?.user) {
        setUser({ ...currentUser.user, avatarUrl: null });
      }
    } catch (err) {
      // skip
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AvatarUploader
      currentImageUrl={currentUser?.user.avatarUrl}
      fallbackName={currentUser?.user.name}
      isLoading={isLoading}
      onRemove={handleRemove}
      onUpload={handleUpload}
      size="60px"
      type={AvatarIconType.AVATAR}
    />
  );
}
