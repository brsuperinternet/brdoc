import {
  UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createPersonalSpace,
  getPersonalSpace,
} from "@/ee/personal-space/services/personal-space-service";
import { ISpace } from "@/features/space/types/space.types";

export function usePersonalSpaceQuery(
  enabled: boolean
): UseQueryResult<ISpace | null, Error> {
  return useQuery({
    enabled,
    queryFn: () => getPersonalSpace(),
    queryKey: ["personal-space"],
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreatePersonalSpaceMutation() {
  const queryClient = useQueryClient();

  return useMutation<ISpace, Error, { name?: string }>({
    mutationFn: (data) => createPersonalSpace(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personal-space"] });
      queryClient.invalidateQueries({ queryKey: ["spaces"] });
    },
  });
}
