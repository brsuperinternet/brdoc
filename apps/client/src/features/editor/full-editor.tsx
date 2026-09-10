import {
  ActionIcon,
  Container,
  Divider,
  Group,
  Popover,
  Stack,
  Text,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import clsx from "clsx";
import { useAtom } from "jotai";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { CustomAvatar } from "@/components/ui/custom-avatar.tsx";
import { PageVerificationBadge } from "@/ee/page-verification";
import { currentPageEditModeAtom } from "@/features/editor/atoms/editor-atoms.ts";
import { EmptyPageGetStarted } from "@/features/editor/components/empty-page/empty-page-get-started";
import { FixedToolbar } from "@/features/editor/components/fixed-toolbar/fixed-toolbar";
import PageEditor from "@/features/editor/page-editor";
import classes from "@/features/editor/styles/editor.module.css";
import { TitleEditor } from "@/features/editor/title-editor";
import { DeletedPageBanner } from "@/features/page/trash/components/deleted-page-banner.tsx";
import { IContributor } from "@/features/page/types/page.types.ts";
import { userAtom } from "@/features/user/atoms/current-user-atom.ts";
import { PageEditMode } from "@/features/user/types/user.types.ts";
import { useAsideTriggerProps } from "@/hooks/use-toggle-aside.tsx";

const MemoizedTitleEditor = React.memo(TitleEditor);
const MemoizedPageEditor = React.memo(PageEditor);
const MemoizedFixedToolbar = React.memo(FixedToolbar);
const MemoizedDeletedPageBanner = React.memo(DeletedPageBanner);

type PageUser = {
  id: string;
  name: string;
  avatarUrl: string;
};

// Module-level flag: survives component unmount/remount on page navigation,
// reset only on full page reload (i.e. a new app session).
let defaultEditModeApplied = false;

export interface FullEditorProps {
  canComment?: boolean;
  content: string;
  contributors?: IContributor[];
  creator?: PageUser;
  editable: boolean;
  pageId: string;
  slugId: string;
  spaceSlug: string;
  title: string;
}

export function FullEditor({
  pageId,
  title,
  slugId,
  content,
  spaceSlug,
  editable,
  creator,
  contributors,
  canComment,
}: FullEditorProps) {
  const [user] = useAtom(userAtom);
  const fullPageWidth = user.settings?.preferences?.fullPageWidth;
  const editorToolbarEnabled =
    user.settings?.preferences?.editorToolbar ?? false;
  const [currentPageEditMode, setCurrentPageEditMode] = useAtom(
    currentPageEditModeAtom
  );
  const userPageEditMode =
    user.settings?.preferences?.pageEditMode ?? PageEditMode.Edit;
  const isEditMode = currentPageEditMode === PageEditMode.Edit;

  // Apply the user's saved preference only once on initial load, not on every
  // page navigation — so the mode sticks across navigations within a session.
  useEffect(() => {
    if (!defaultEditModeApplied) {
      setCurrentPageEditMode(userPageEditMode as PageEditMode);
      defaultEditModeApplied = true;
    }
  }, [userPageEditMode, setCurrentPageEditMode]);

  return (
    <Container
      className={classes.editor}
      fluid={fullPageWidth}
      size={!fullPageWidth && 900}
      style={{ display: "flex", flexDirection: "column" }}
    >
      {editorToolbarEnabled && editable && isEditMode && (
        <MemoizedFixedToolbar />
      )}
      <MemoizedDeletedPageBanner slugId={slugId} />
      <MemoizedTitleEditor
        editable={editable}
        pageId={pageId}
        slugId={slugId}
        spaceSlug={spaceSlug}
        title={title}
      />
      <PageByline
        contributors={contributors}
        creator={creator}
        readOnly={!editable}
      />
      <MemoizedPageEditor
        canComment={canComment}
        content={content}
        editable={editable}
        pageId={pageId}
      />
      <EmptyPageGetStarted editable={editable} pageId={pageId} />
    </Container>
  );
}

type PageBylineProps = {
  creator?: PageUser;
  contributors?: IContributor[];
  readOnly?: boolean;
};

function PageByline({ creator, contributors, readOnly }: PageBylineProps) {
  const { t } = useTranslation();
  const detailsTriggerProps = useAsideTriggerProps("details");

  const otherContributors = (contributors ?? []).filter(
    (c) => c.id !== creator?.id
  );

  return (
    <Group
      className={clsx("print-hide", classes.byline)}
      gap="sm"
      mb="md"
      style={{ marginTop: "-0.5em" }}
    >
      {creator && (
        <Popover position="bottom-start" shadow="md" width={280} withArrow>
          <Popover.Target>
            <UnstyledButton
              aria-label={t("Created by {{name}}", { name: creator.name })}
            >
              <Group gap={6}>
                <CustomAvatar
                  avatarUrl={creator.avatarUrl}
                  name={creator.name}
                  size={22}
                />
                <Text c="dimmed" size="sm">
                  {t("By {{name}}", { name: creator.name })}
                </Text>
              </Group>
            </UnstyledButton>
          </Popover.Target>
          <Popover.Dropdown>
            <Stack gap="xs">
              <Group gap="sm">
                <CustomAvatar
                  avatarUrl={creator.avatarUrl}
                  name={creator.name}
                  size={36}
                />
                <div>
                  <Text fw={500} size="sm">
                    {creator.name}
                  </Text>
                  <Text c="dimmed" size="xs">
                    {otherContributors.length === 0
                      ? t("Owner, no contributors")
                      : t("Owner")}
                  </Text>
                </div>
              </Group>

              {otherContributors.length > 0 && (
                <>
                  <Divider />
                  <Text c="dimmed" fw={500} size="xs" tt="uppercase">
                    {t("Contributors")}
                  </Text>
                  <Stack gap={6}>
                    {otherContributors.map((contributor) => (
                      <Group gap="sm" key={contributor.id}>
                        <CustomAvatar
                          avatarUrl={contributor.avatarUrl}
                          name={contributor.name}
                          size={28}
                        />
                        <Text size="sm">{contributor.name}</Text>
                      </Group>
                    ))}
                  </Stack>
                </>
              )}
            </Stack>
          </Popover.Dropdown>
        </Popover>
      )}
      <Tooltip label={t("Details")} openDelay={250} withArrow>
        <ActionIcon
          aria-label={t("Details")}
          color="gray"
          variant="subtle"
          {...detailsTriggerProps}
        >
          <IconInfoCircle size={20} stroke={1.5} />
        </ActionIcon>
      </Tooltip>

      <PageVerificationBadge readOnly={readOnly} />
    </Group>
  );
}
