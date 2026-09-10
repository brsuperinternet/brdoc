import { Group, Space, TextInput } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconSearch } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Paginate from "@/components/common/paginate";
import SettingsTitle from "@/components/settings/settings-title";
import { DocumentTitle } from "@/components/ui/document-title.tsx";
import VerificationListTable from "@/ee/page-verification/components/verification-list-table";
import { useVerificationListQuery } from "@/ee/page-verification/queries/page-verification-query";
import { IVerificationListParams } from "@/ee/page-verification/types/page-verification.types";
import { useGetSpacesQuery } from "@/features/space/queries/space-query";
import { useCursorPaginate } from "@/hooks/use-cursor-paginate";

export default function VerifiedPages() {
  const { t } = useTranslation();
  const { cursor, goNext, goPrev, resetCursor } = useCursorPaginate();

  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch] = useDebouncedValue(searchValue, 300);
  const [spaceFilter, setSpaceFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const { data: spacesData } = useGetSpacesQuery({ limit: 100 });

  const spaceOptions = useMemo(
    () =>
      spacesData?.items?.map((space) => ({
        label: space.name,
        value: space.id,
      })) ?? [],
    [spacesData]
  );

  const typeOptions = [
    { label: t("Expiring"), value: "expiring" },
    { label: t("QMS"), value: "qms" },
  ];

  const params: IVerificationListParams = useMemo(
    () => ({
      cursor,
      limit: 50,
      query: debouncedSearch || undefined,
      spaceIds: spaceFilter.length > 0 ? spaceFilter : undefined,
      type: typeFilter as IVerificationListParams["type"],
    }),
    [cursor, spaceFilter, typeFilter, debouncedSearch]
  );

  const { data, isLoading } = useVerificationListQuery(params);

  const handleSpaceChange = (value: string[]) => {
    setSpaceFilter(value);
    resetCursor();
  };

  const handleTypeChange = (value: string | null) => {
    setTypeFilter(value);
    resetCursor();
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.currentTarget.value);
    resetCursor();
  };

  return (
    <>
      <DocumentTitle title={t("Verified pages")} />

      <SettingsTitle title={t("Verified pages")} />

      <Group gap="sm" mb="md">
        <TextInput
          leftSection={<IconSearch size={16} />}
          onChange={handleSearchChange}
          placeholder={t("Search by title")}
          size="sm"
          value={searchValue}
          w={220}
        />

        {/*
        <MultiSelect
          placeholder={t("Filter by space")}
          data={spaceOptions}
          value={spaceFilter}
          onChange={handleSpaceChange}
          clearable
          searchable
          w={220}
          size="sm"
        />

        <Select
          placeholder={t("Filter by type")}
          data={typeOptions}
          value={typeFilter}
          onChange={handleTypeChange}
          clearable
          w={160}
          size="sm"
        />
        */}
      </Group>

      <VerificationListTable isLoading={isLoading} items={data?.items} />

      <Space h="md" />

      {data?.items && data.items.length > 0 && (
        <Paginate
          hasNextPage={data?.meta?.hasNextPage}
          hasPrevPage={data?.meta?.hasPrevPage}
          onNext={() => goNext(data?.meta?.nextCursor)}
          onPrev={goPrev}
        />
      )}
    </>
  );
}
