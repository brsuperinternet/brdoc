import { Editor, Range } from "@tiptap/core";

export interface MentionListProps {
  command: any;
  editor: Editor;
  isInCommentContext?: boolean;
  items: [];
  query: string;
  range: Range;
  text: string;
}

export type MentionSuggestionItem =
  | { entityType: "header"; label: string }
  | {
      id: string;
      label: string;
      entityType: "user";
      entityId: string;
      avatarUrl: string;
    }
  | {
      id: string;
      label: string;
      entityType: "page";
      entityId: string;
      slugId: string;
      icon: string;
      spaceName?: string;
      spaceSlug?: string;
    };
