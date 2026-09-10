import { useDebouncedValue } from "@mantine/hooks";
import { useQuery } from "@tanstack/react-query";
import { searchSuggestions } from "@/features/search/services/search-service";

export type PersonSuggestion = {
  id: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
};

export function usePersonSearch(
  search: string,
  enabled: boolean
): PersonSuggestion[] {
  const [debounced] = useDebouncedValue(search, 250);
  const trimmed = debounced.trim();
  const { data = [] } = useQuery({
    enabled,
    queryFn: async () => {
      const res = await searchSuggestions({
        includeUsers: true,
        limit: trimmed ? 25 : 10,
        query: trimmed,
      });
      return (res.users ?? []) as PersonSuggestion[];
    },
    queryKey: ["bases", "persons", "search", trimmed],
    staleTime: 15_000,
  });
  return data;
}
