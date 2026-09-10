import { Button, Group } from "@mantine/core";
import { useTranslation } from "react-i18next";

export interface PagePaginationProps {
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onNext: () => void;
  onPrev: () => void;
}

export default function Paginate({
  hasPrevPage,
  hasNextPage,
  onPrev,
  onNext,
}: PagePaginationProps) {
  const { t } = useTranslation();

  if (!(hasPrevPage || hasNextPage)) {
    return null;
  }

  return (
    <Group justify="flex-end" mt="md">
      <Button
        disabled={!hasPrevPage}
        onClick={onPrev}
        size="compact-sm"
        variant="default"
      >
        {t("Prev")}
      </Button>

      <Button
        disabled={!hasNextPage}
        onClick={onNext}
        size="compact-sm"
        variant="default"
      >
        {t("Next")}
      </Button>
    </Group>
  );
}
