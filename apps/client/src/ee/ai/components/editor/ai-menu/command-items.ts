import {
  IconAlignJustified,
  IconArrowDownLeft,
  IconCheck,
  IconChevronLeft,
  IconCopy,
  IconHelp,
  IconLanguage,
  IconList,
  IconMoodSmile,
  IconRefresh,
  IconSparkles,
  IconTextPlus,
  IconTrash,
  IconWriting,
} from "@tabler/icons-react";
import { AiAction } from "@/ee/ai/types/ai.types.ts";

interface CommandItem {
  action?: AiAction;
  icon?: typeof IconSparkles;
  id: string;
  name: string;
  prompt?: string;
  subCommandSet?: CommandSet;
}

type CommandSet = "main" | "tone" | "translate" | "result";

const mainItems: CommandItem[] = [
  {
    action: AiAction.IMPROVE_WRITING,
    icon: IconSparkles,
    id: "improve-writing",
    name: "Improve writing",
  },
  {
    action: AiAction.FIX_SPELLING_GRAMMAR,
    icon: IconCheck,
    id: "fix-spelling-grammar",
    name: "Fix spelling & grammar",
  },
  {
    action: AiAction.MAKE_LONGER,
    icon: IconTextPlus,
    id: "make-longer",
    name: "Make longer",
  },
  {
    action: AiAction.MAKE_SHORTER,
    icon: IconAlignJustified,
    id: "make-shorter",
    name: "Make shorter",
  },
  {
    action: AiAction.CONTINUE_WRITING,
    icon: IconWriting,
    id: "continue-writing",
    name: "Continue writing",
  },
  {
    action: AiAction.EXPLAIN,
    icon: IconHelp,
    id: "explain",
    name: "Explain",
  },
  {
    action: AiAction.SUMMARIZE,
    icon: IconList,
    id: "summarize",
    name: "Summarize",
  },
  {
    icon: IconMoodSmile,
    id: "change-tone",
    name: "Change tone",
    subCommandSet: "tone",
  },
  {
    icon: IconLanguage,
    id: "translate",
    name: "Translate",
    subCommandSet: "translate",
  },
];
const toneItems: CommandItem[] = [
  {
    icon: IconChevronLeft,
    id: "back",
    name: "Back",
  },
  {
    action: AiAction.CHANGE_TONE,
    icon: IconMoodSmile,
    id: "tone-professional",
    name: "Professional",
    prompt: "Professional",
  },
  {
    action: AiAction.CHANGE_TONE,
    icon: IconMoodSmile,
    id: "tone-casual",
    name: "Casual",
    prompt: "Casual",
  },
  {
    action: AiAction.CHANGE_TONE,
    icon: IconMoodSmile,
    id: "tone-friendly",
    name: "Friendly",
    prompt: "Friendly",
  },
];
const translateItems: CommandItem[] = [
  {
    icon: IconChevronLeft,
    id: "back",
    name: "Back",
  },
  {
    action: AiAction.TRANSLATE,
    icon: IconLanguage,
    id: "translate-english",
    name: "English",
    prompt: "English",
  },
  {
    action: AiAction.TRANSLATE,
    icon: IconLanguage,
    id: "translate-spanish",
    name: "Spanish",
    prompt: "Spanish",
  },
  {
    action: AiAction.TRANSLATE,
    icon: IconLanguage,
    id: "translate-german",
    name: "German",
    prompt: "German",
  },
  {
    action: AiAction.TRANSLATE,
    icon: IconLanguage,
    id: "translate-french",
    name: "French",
    prompt: "French",
  },
  {
    action: AiAction.TRANSLATE,
    icon: IconLanguage,
    id: "translate-dutch",
    name: "Dutch",
    prompt: "Dutch",
  },
  {
    action: AiAction.TRANSLATE,
    icon: IconLanguage,
    id: "translate-portuguese",
    name: "Portuguese",
    prompt: "Portuguese",
  },
  {
    action: AiAction.TRANSLATE,
    icon: IconLanguage,
    id: "translate-italian",
    name: "Italian",
    prompt: "Italian",
  },
  {
    action: AiAction.TRANSLATE,
    icon: IconLanguage,
    id: "translate-japanese",
    name: "Japanese",
    prompt: "Japanese",
  },
  {
    action: AiAction.TRANSLATE,
    icon: IconLanguage,
    id: "translate-korean",
    name: "Korean",
    prompt: "Korean",
  },
  {
    action: AiAction.TRANSLATE,
    icon: IconLanguage,
    id: "translate-swedish",
    name: "Swedish",
    prompt: "Swedish",
  },
  {
    action: AiAction.TRANSLATE,
    icon: IconLanguage,
    id: "translate-chinese",
    name: "Chinese (Simplified)",
    prompt: "Simplified Chinese",
  },
];
const resultItems: CommandItem[] = [
  { icon: IconCheck, id: "result-replace", name: "Replace" },
  { icon: IconArrowDownLeft, id: "result-insert-below", name: "Insert below" },
  { icon: IconCopy, id: "result-copy", name: "Copy" },
  { icon: IconTrash, id: "result-discard", name: "Discard" },
  {
    icon: IconRefresh,
    id: "result-try-again",
    name: "Try again",
  },
];
const commandItems: Record<CommandSet, CommandItem[]> = {
  main: mainItems,
  result: resultItems,
  tone: toneItems,
  translate: translateItems,
};

export type { CommandItem, CommandSet };
export { commandItems };
