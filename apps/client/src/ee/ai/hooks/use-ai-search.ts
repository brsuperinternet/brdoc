import { UseMutationResult, useMutation } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import {
  aiAnswers,
  IAiSearchResponse,
} from "@/ee/ai/services/ai-search-service.ts";
import { IPageSearchParams } from "@/features/search/types/search.types.ts";

// @ts-expect-error
interface UseAiSearchResult
  extends UseMutationResult<IAiSearchResponse, Error, IPageSearchParams> {
  clearStreaming: () => void;
  streamingAnswer: string;
  streamingSources: any[];
}

export function useAiSearch(): UseAiSearchResult {
  const [streamingAnswer, setStreamingAnswer] = useState("");
  const [streamingSources, setStreamingSources] = useState<any[]>([]);

  const clearStreaming = useCallback(() => {
    setStreamingAnswer("");
    setStreamingSources([]);
  }, []);

  const mutation = useMutation({
    mutationFn: async (
      params: IPageSearchParams & { contentType?: string }
    ) => {
      setStreamingAnswer("");
      setStreamingSources([]);

      const { contentType, ...apiParams } = params;

      return await aiAnswers(apiParams, (chunk) => {
        if (chunk.content) {
          setStreamingAnswer((prev) => prev + chunk.content);
        }
        if (chunk.sources) {
          setStreamingSources(chunk.sources);
        }
      });
    },
  });

  return {
    ...mutation,
    clearStreaming,
    streamingAnswer,
    streamingSources,
  };
}
