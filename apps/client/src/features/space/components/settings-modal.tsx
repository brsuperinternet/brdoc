import { Group, Modal, rem, ScrollArea, Tabs, Text } from "@mantine/core";
import { useAtom } from "jotai";
import { useTranslation } from "react-i18next";
import PublishSpaceSettings from "@/features/public-space/components/publish-space-settings.tsx";
import { isPublicSpacesAllowed } from "@/features/public-space/utils/public-space-access.ts";
import AddSpaceMembersModal from "@/features/space/components/add-space-members-modal.tsx";
import SpaceDetails from "@/features/space/components/space-details.tsx";
import SpaceMembersList from "@/features/space/components/space-members.tsx";
import SpaceSecuritySettings from "@/features/space/components/space-security-settings.tsx";
import {
  SpaceCaslAction,
  SpaceCaslSubject,
} from "@/features/space/permissions/permissions.type.ts";
import { useSpaceAbility } from "@/features/space/permissions/use-space-ability.ts";
import { useSpaceQuery } from "@/features/space/queries/space-query.ts";
import { workspaceAtom } from "@/features/user/atoms/current-user-atom.ts";

interface SpaceSettingsModalProps {
  onClose: () => void;
  opened: boolean;
  spaceId: string;
}

export default function SpaceSettingsModal({
  spaceId,
  opened,
  onClose,
}: SpaceSettingsModalProps) {
  const { t } = useTranslation();
  const { data: space, isLoading } = useSpaceQuery(spaceId);

  const spaceRules = space?.membership?.permissions;
  const spaceAbility = useSpaceAbility(spaceRules);

  const [workspace] = useAtom(workspaceAtom);
  const allowPublicSpaces = isPublicSpacesAllowed(workspace);
  const canManageSettings = spaceAbility.can(
    SpaceCaslAction.Manage,
    SpaceCaslSubject.Settings
  );

  return (
    <>
      <Modal.Root
        mah={400}
        onClose={onClose}
        opened={opened}
        padding="xl"
        size={600}
        xOffset={0}
        yOffset="10vh"
      >
        <Modal.Overlay />
        <Modal.Content style={{ overflow: "hidden" }}>
          <Modal.Header py={0}>
            <Modal.Title>
              <Text fw={500} lineClamp={1}>
                {space?.name}
              </Text>
            </Modal.Title>
            <Modal.CloseButton aria-label={t("Close")} />
          </Modal.Header>
          <Modal.Body>
            <div style={{ height: rem(600) }}>
              <Tabs color="dark" defaultValue="members">
                <Tabs.List>
                  <Tabs.Tab fw={500} value="general">
                    {t("Settings")}
                  </Tabs.Tab>
                  <Tabs.Tab fw={500} value="members">
                    {t("Members")}
                  </Tabs.Tab>
                  {canManageSettings && allowPublicSpaces && (
                    <Tabs.Tab fw={500} value="publish">
                      {t("Publish")}
                    </Tabs.Tab>
                  )}
                  {canManageSettings && (
                    <Tabs.Tab fw={500} value="security">
                      {t("Security")}
                    </Tabs.Tab>
                  )}
                </Tabs.List>

                <Tabs.Panel value="general">
                  <ScrollArea h={580} pr={8} scrollbarSize={5}>
                    <div style={{ paddingBottom: "100px" }}>
                      <SpaceDetails
                        readOnly={spaceAbility.cannot(
                          SpaceCaslAction.Manage,
                          SpaceCaslSubject.Settings
                        )}
                        spaceId={space?.id}
                      />
                    </div>
                  </ScrollArea>
                </Tabs.Panel>

                <Tabs.Panel value="members">
                  <Group justify="flex-end" my="md">
                    {spaceAbility.can(
                      SpaceCaslAction.Manage,
                      SpaceCaslSubject.Member
                    ) && <AddSpaceMembersModal spaceId={space?.id} />}
                  </Group>

                  <SpaceMembersList
                    readOnly={spaceAbility.cannot(
                      SpaceCaslAction.Manage,
                      SpaceCaslSubject.Member
                    )}
                    spaceId={space?.id}
                  />
                </Tabs.Panel>

                <Tabs.Panel value="security">
                  <ScrollArea h={580} pr={8} scrollbarSize={5}>
                    <div style={{ paddingBottom: "100px" }}>
                      <SpaceSecuritySettings
                        readOnly={spaceAbility.cannot(
                          SpaceCaslAction.Manage,
                          SpaceCaslSubject.Settings
                        )}
                        space={space}
                      />
                    </div>
                  </ScrollArea>
                </Tabs.Panel>

                <Tabs.Panel value="publish">
                  <ScrollArea h={580} pr={8} scrollbarSize={5}>
                    <div style={{ paddingBottom: "100px" }}>
                      {canManageSettings && allowPublicSpaces && (
                        <PublishSpaceSettings space={space} />
                      )}
                    </div>
                  </ScrollArea>
                </Tabs.Panel>
              </Tabs>
            </div>
          </Modal.Body>
        </Modal.Content>
      </Modal.Root>
    </>
  );
}
