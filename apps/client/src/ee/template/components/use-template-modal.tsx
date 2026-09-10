import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { DestinationSelection } from "@/components/ui/destination-picker/destination-picker.types";
import { DestinationPickerModal } from "@/components/ui/destination-picker/destination-picker-modal";
import { useUseTemplateMutation } from "@/ee/template/queries/template-query";
import { ITemplate } from "@/ee/template/types/template.types";
import { buildPageUrl } from "@/features/page/page.utils";

type UseTemplateModalProps = {
  template: ITemplate;
  opened: boolean;
  onClose: () => void;
  initialSpaceId?: string;
};

export default function UseTemplateModal({
  template,
  opened,
  onClose,
  initialSpaceId,
}: UseTemplateModalProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const useTemplateMutation = useUseTemplateMutation();

  const handleSelect = async (selection: DestinationSelection) => {
    const spaceId = selection.spaceId;
    const parentPageId =
      selection.type === "page" ? selection.pageId : undefined;

    try {
      const page = await useTemplateMutation.mutateAsync({
        parentPageId,
        spaceId,
        templateId: template.id,
      });

      onClose();

      if (page?.slugId) {
        const space = selection.space;
        if (space?.slug) {
          navigate(buildPageUrl(space.slug, page.slugId, page.title));
        }
      }
    } catch {
      // error notification handled by mutation's onError
    }
  };

  return (
    <DestinationPickerModal
      actionLabel={t("Create page")}
      initialSpaceId={initialSpaceId ?? template.spaceId}
      loading={useTemplateMutation.isPending}
      onClose={onClose}
      onSelect={handleSelect}
      opened={opened}
      searchSpacesOnly
      title={t("Choose destination")}
    />
  );
}
