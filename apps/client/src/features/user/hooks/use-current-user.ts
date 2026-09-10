import { UseQueryResult, useQuery } from "@tanstack/react-query";
import { getMyInfo } from "@/features/user/services/user-service";
import { ICurrentUser } from "@/features/user/types/user.types";

export default function useCurrentUser(): UseQueryResult<ICurrentUser> {
  return useQuery({
    queryFn: async () => await getMyInfo(),
    queryKey: ["currentUser"],
  });
}
