import { Table, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";

interface NoTableResultsProps {
  colSpan: number;
  text?: string;
}
export default function NoTableResults({ colSpan, text }: NoTableResultsProps) {
  const { t } = useTranslation();
  return (
    <Table.Tr>
      <Table.Td colSpan={colSpan}>
        <Text c="dimmed" fw={500} ta="center">
          {text || t("No results found...")}
        </Text>
      </Table.Td>
    </Table.Tr>
  );
}
