import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationsRead,
} from "../services/notification-service";

export const NOTIFICATION_KEY = ["notifications"];
export const UNREAD_COUNT_KEY = ["notifications", "unread-count"];

export function useNotificationsQuery(type?: string) {
  return useInfiniteQuery({
    gcTime: 0,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage ? lastPage.meta.nextCursor : undefined,
    initialPageParam: undefined as string | undefined,
    placeholderData: keepPreviousData,
    queryFn: ({ pageParam }) => getNotifications({ cursor: pageParam, type }),
    queryKey: [...NOTIFICATION_KEY, type],
    staleTime: 0,
  });
}

export function useUnreadCountQuery() {
  return useQuery({
    queryFn: getUnreadCount,
    queryKey: UNREAD_COUNT_KEY,
  });
}

export function useMarkReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationIds: string[]) =>
      markNotificationsRead(notificationIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEY });
    },
  });
}

export function useMarkAllReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEY });
    },
  });
}
