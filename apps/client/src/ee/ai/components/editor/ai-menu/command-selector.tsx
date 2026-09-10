import { Loader, Menu, ScrollArea } from "@mantine/core";
import { IconChevronRight } from "@tabler/icons-react";
import { ReactNode } from "react";
import classes from "./ai-menu.module.css";
import { CommandItem } from "./command-items.ts";

interface CommandSelectorProps {
  children: ReactNode;
  currentItems: CommandItem[];
  handleCommand(item: CommandItem): void;

  isLoading: boolean;
  output: string;
  selectedIndex: number;
}

const CommandSelector = ({
  selectedIndex,
  children,
  isLoading,
  output,
  currentItems,
  handleCommand,
}: CommandSelectorProps) => (
  <Menu
    middlewares={{ flip: false }}
    offset={4}
    opened={!isLoading && currentItems.length > 0}
    position="bottom-start"
    shadow="lg"
    trapFocus={false}
    width={250}
  >
    <Menu.Target>{children}</Menu.Target>
    <Menu.Dropdown>
      <ScrollArea.Autosize mah={300} scrollbarSize={5} type="scroll">
        {currentItems.map((item, index) => {
          const isSelected = selectedIndex === index;
          const showLoader = isLoading && output === "" && !item.subCommandSet;

          return (
            <Menu.Item
              className={isSelected ? classes.menuItemSelected : undefined}
              disabled={isLoading}
              key={item.id}
              leftSection={
                showLoader ? (
                  <Loader size={14} />
                ) : item.icon ? (
                  <item.icon size={16} />
                ) : undefined
              }
              onClick={() => handleCommand(item)}
              rightSection={
                item.subCommandSet ? <IconChevronRight size={14} /> : undefined
              }
            >
              {item.name}
            </Menu.Item>
          );
        })}
      </ScrollArea.Autosize>
    </Menu.Dropdown>
  </Menu>
);

export { CommandSelector };
