import { Group, Text, TextInput, UnstyledButton } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import classes from "@/ee/base/styles/formula.module.css";
import type { IBaseProperty } from "@/ee/base/types/base.types";

export function PropertyChipRow({
  properties,
  onInsert,
}: {
  properties: IBaseProperty[];
  onInsert: (name: string) => void;
}) {
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return properties;
    }
    return properties.filter((p) => p.name.toLowerCase().includes(q));
  }, [properties, query]);

  return (
    <div>
      <Group justify="space-between" mb={8}>
        <Text c="gray.7" fw={600} size="xs">
          Properties
        </Text>
        <TextInput
          leftSection={<IconSearch size={12} />}
          onChange={(e) => setQuery(e.currentTarget.value)}
          placeholder="Search"
          size="xs"
          value={query}
          w={140}
        />
      </Group>
      {visible.length === 0 ? (
        <Text c="dimmed" py={6} size="xs">
          No matches.
        </Text>
      ) : (
        <Group gap={6}>
          {visible.map((p) => (
            <UnstyledButton
              className={classes.propChip}
              key={p.id}
              onClick={() => onInsert(p.name)}
            >
              {p.name}
            </UnstyledButton>
          ))}
        </Group>
      )}
    </div>
  );
}
