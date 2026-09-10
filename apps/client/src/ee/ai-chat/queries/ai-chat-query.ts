import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  deleteChat,
  getChatInfo,
  listChats,
  searchChats,
  updateChatTitle,
} from "../services/ai-chat-service";

export function useChatsQuery() {
  return useInfiniteQuery({
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage ? lastPage.meta.nextCursor : undefined,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => listChats({ cursor: pageParam, limit: 30 }),
    queryKey: ["ai-chats"],
  });
}

export function useChatInfoQuery(chatId: string | undefined) {
  return useQuery({
    enabled: !!chatId,
    queryFn: () => getChatInfo(chatId!),
    queryKey: ["ai-chat", chatId],
  });
}

export function useDeleteChatMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (chatId: string) => deleteChat(chatId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-chats"] });
    },
  });
}

export function useUpdateChatTitleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ chatId, title }: { chatId: string; title: string }) =>
      updateChatTitle(chatId, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-chats"] });
    },
  });
}

export function useSearchChatsQuery(query: string) {
  return useQuery({
    enabled: query.length > 0,
    queryFn: () => searchChats(query),
    queryKey: ["ai-chats-search", query],
  });
}
