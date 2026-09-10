import { ActionIcon, Popover, Stack } from "@mantine/core";
import { IconDots, IconEyeOff, IconSettings } from "@tabler/icons-react";
import { useAtom } from "jotai";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  propertyMenuCloseRequestAtomFamily,
  propertyMenuDirtyAtomFamily,
} from "@/ee/base/atoms/base-atoms";
import {
  MenuItem,
  PropertyMenuContent,
} from "@/ee/base/components/property/property-menu";
import { IBaseProperty } from "@/ee/base/types/base.types";

type KanbanColumnMenuProps = {
  property: IBaseProperty;
  pageId: string;
  onHide: () => void;
};

export function KanbanColumnMenu({
  property,
  pageId,
  onHide,
}: KanbanColumnMenuProps) {
  const { t } = useTranslation();
  const [opened, setOpened] = useState(false);
  const [view, setView] = useState<"menu" | "property">("menu");
  const [dirty, setDirty] = useAtom(
    propertyMenuDirtyAtomFamily(pageId)
  ) as unknown as [boolean, (val: boolean) => void];
  const [closeRequest, setCloseRequest] = useAtom(
    propertyMenuCloseRequestAtomFamily(pageId)
  ) as unknown as [number, (val: number) => void];

  const handleClose = useCallback(() => {
    setOpened(false);
    setView("menu");
  }, []);

  const wasOpenedRef = useRef(opened);
  useEffect(() => {
    if (wasOpenedRef.current && !opened) {
      setDirty(false);
    }
    wasOpenedRef.current = opened;
  }, [opened, setDirty]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (next) {
        return;
      }
      if (dirty) {
        setCloseRequest(closeRequest + 1);
      } else {
        handleClose();
      }
    },
    [dirty, closeRequest, setCloseRequest, handleClose]
  );

  const toggle = useCallback(() => {
    if (opened) {
      handleOpenChange(false);
    } else if (!dirty) {
      setOpened(true);
    }
  }, [opened, dirty, handleOpenChange]);

  return (
    <Popover
      closeOnClickOutside
      closeOnEscape
      onChange={handleOpenChange}
      onClose={handleClose}
      opened={opened}
      position="bottom-end"
      returnFocus
      shadow="md"
      trapFocus
      width={260}
      withinPortal
    >
      <Popover.Target>
        <ActionIcon
          aria-label={t("Column options")}
          color="gray"
          onClick={toggle}
          size="sm"
          variant="subtle"
        >
          <IconDots size={14} />
        </ActionIcon>
      </Popover.Target>
      <Popover.Dropdown
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        p={0}
      >
        {view === "menu" ? (
          <Stack gap={0} p={4}>
            <MenuItem
              icon={<IconSettings size={14} />}
              label={t("Edit property")}
              onClick={() => setView("property")}
            />
            <MenuItem
              icon={<IconEyeOff size={14} />}
              label={t("Hide group")}
              onClick={() => {
                handleClose();
                onHide();
              }}
            />
          </Stack>
        ) : (
          <PropertyMenuContent
            initialPanel={property.pendingType ? "main" : "options"}
            onClose={handleClose}
            onDirtyChange={setDirty}
            opened={opened}
            pageId={pageId}
            property={property}
          />
        )}
      </Popover.Dropdown>
    </Popover>
  );
}
