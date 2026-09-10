import {
  Button,
  Group,
  Loader,
  Modal,
  ScrollArea,
  SegmentedControl,
  Text,
  TextInput,
  UnstyledButton,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconArrowRight, IconFileText, IconSearch } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import TemplatePreviewModal from "@/ee/template/components/template-preview-modal";
import UseTemplateModal from "@/ee/template/components/use-template-modal";
import {
  useGetTemplatesQuery,
  useUseTemplateMutation,
} from "@/ee/template/queries/template-query";
import { ITemplate } from "@/ee/template/types/template.types";
import { buildPageUrl } from "@/features/page/page.utils";
import { useGetSpacesQuery } from "@/features/space/queries/space-query";
import classes from "./template-picker-modal.module.css";

type TemplatePickerModalProps = {
  opened: boolean;
  onClose: () => void;
  /** Pre-select this space in the destination picker after a template is chosen. */
  initialSpaceId?: string;
};

type ScopeFilter = "current" | "all";

export default function TemplatePickerModal({
  opened,
  onClose,
  initialSpaceId,
}: TemplatePickerModalProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const useTemplateMutation = useUseTemplateMutation();
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebouncedValue(query, 200);
  const [scope, setScope] = useState<ScopeFilter>(
    initialSpaceId ? "current" : "all"
  );
  // Two-stage selection: previewing first, then destination-picker.
  // `previewTemplate` is set when the user clicks a row in the picker.
  // `destinationTemplate` is set when they click "Use template" in the preview.
  const [previewTemplate, setPreviewTemplate] = useState<ITemplate | null>(
    null
  );
  const [destinationTemplate, setDestinationTemplate] =
    useState<ITemplate | null>(null);

  const { data, isPending } = useGetTemplatesQuery({
    spaceId: scope === "current" ? initialSpaceId : undefined,
  });
  const { data: spacesData } = useGetSpacesQuery({ limit: 100 });

  const spaceNamesById = useMemo(() => {
    const map = new Map<string, string>();
    spacesData?.items?.forEach((s) => map.set(s.id, s.name));
    return map;
  }, [spacesData]);

  const filtered = useMemo(() => {
    const all = data?.pages.flatMap((p) => p.items) ?? [];
    const term = debouncedQuery.trim().toLowerCase();
    if (!term) {
      return all;
    }
    return all.filter((tpl) => tpl.title.toLowerCase().includes(term));
  }, [data, debouncedQuery]);

  const createInInitialSpace = async (tpl: ITemplate) => {
    if (!initialSpaceId) {
      return;
    }
    try {
      const page = await useTemplateMutation.mutateAsync({
        spaceId: initialSpaceId,
        templateId: tpl.id,
      });
      setPreviewTemplate(null);
      onClose();
      const space = spacesData?.items?.find((s) => s.id === initialSpaceId);
      if (page?.slugId && space?.slug) {
        navigate(buildPageUrl(space.slug, page.slugId, page.title));
      }
    } catch {
      // error notification handled by mutation's onError
    }
  };

  const handlePick = (tpl: ITemplate) => {
    setPreviewTemplate(tpl);
  };

  const handleQuickUse = (tpl: ITemplate) => {
    if (initialSpaceId) {
      createInInitialSpace(tpl);
      return;
    }
    setDestinationTemplate(tpl);
  };

  const handlePreviewClose = () => {
    // Closing preview returns to the picker list (no full unmount).
    setPreviewTemplate(null);
  };

  const handlePreviewUse = () => {
    if (initialSpaceId && previewTemplate) {
      createInInitialSpace(previewTemplate);
      return;
    }
    // Move from preview into destination-picker stage.
    setDestinationTemplate(previewTemplate);
    setPreviewTemplate(null);
  };

  const handleDestinationClose = () => {
    setDestinationTemplate(null);
    onClose();
  };

  const handleClose = () => {
    setQuery("");
    setScope(initialSpaceId ? "current" : "all");
    setPreviewTemplate(null);
    setDestinationTemplate(null);
    onClose();
  };

  return (
    <>
      <Modal
        onClose={handleClose}
        opened={opened && !previewTemplate && !destinationTemplate}
        padding="lg"
        size={550}
        title={<Text fw={500}>{t("Use a template")}</Text>}
        yOffset="10vh"
      >
        <TextInput
          autoFocus
          leftSection={<IconSearch size={16} />}
          mb="xs"
          onChange={(e) => setQuery(e.currentTarget.value)}
          placeholder={t("Search templates...")}
          value={query}
          variant="filled"
        />

        {initialSpaceId && (
          <SegmentedControl
            data={[
              { label: t("This space"), value: "current" },
              { label: t("All templates"), value: "all" },
            ]}
            fullWidth
            mb="sm"
            onChange={(v) => setScope(v as ScopeFilter)}
            size="xs"
            value={scope}
          />
        )}

        <ScrollArea h="50vh" offsetScrollbars>
          {isPending ? (
            <div className={classes.empty}>
              <Loader size="xs" />
            </div>
          ) : filtered.length === 0 ? (
            <div className={classes.empty}>
              <Text c="dimmed" size="sm">
                {t("No templates found")}
              </Text>
            </div>
          ) : (
            filtered.map((tpl) => (
              <UnstyledButton
                className={classes.row}
                key={tpl.id}
                onClick={() => handlePick(tpl)}
              >
                <div className={classes.icon}>
                  {tpl.icon ? (
                    <span>{tpl.icon}</span>
                  ) : (
                    <IconFileText
                      color="var(--mantine-color-gray-6)"
                      size={16}
                    />
                  )}
                </div>
                <div className={classes.title}>{tpl.title}</div>
                <div className={classes.scope}>
                  {tpl.spaceId
                    ? (spaceNamesById.get(tpl.spaceId) ?? t("Space"))
                    : t("Global")}
                </div>
                <Button
                  className={classes.useButton}
                  disabled={useTemplateMutation.isPending}
                  loading={useTemplateMutation.isPending}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickUse(tpl);
                  }}
                  size="compact-xs"
                  variant="filled"
                >
                  {t("Use")}
                </Button>
              </UnstyledButton>
            ))
          )}
        </ScrollArea>

        <Group justify="flex-end" mt="md">
          <Button
            component={Link}
            onClick={handleClose}
            rightSection={<IconArrowRight size={16} />}
            size="sm"
            to="/templates"
            variant="subtle"
          >
            {t("Browse all templates")}
          </Button>
        </Group>
      </Modal>

      {previewTemplate && (
        <TemplatePreviewModal
          onClose={handlePreviewClose}
          onUse={handlePreviewUse}
          opened={true}
          templateId={previewTemplate.id}
          useLoading={useTemplateMutation.isPending}
        />
      )}

      {destinationTemplate && (
        <UseTemplateModal
          initialSpaceId={initialSpaceId}
          onClose={handleDestinationClose}
          opened={true}
          template={destinationTemplate}
        />
      )}
    </>
  );
}
