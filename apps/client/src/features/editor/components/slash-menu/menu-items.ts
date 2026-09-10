import {
  IconAppWindow,
  IconBlockquote,
  IconCalendar,
  IconCaretRightFilled,
  IconCheckbox,
  IconClock,
  IconCode,
  IconColumns2,
  IconColumns3,
  IconFileTypePdf,
  IconH1,
  IconH2,
  IconH3,
  IconInfoCircle,
  IconLayoutKanban,
  IconList,
  IconListNumbers,
  IconMath,
  IconMathFunction,
  IconMenu4,
  IconMoodSmile,
  IconMovie,
  IconMusic,
  IconPageBreak,
  IconPaperclip,
  IconPhoto,
  IconRotate2,
  IconSitemap,
  IconSuperscript,
  IconTable,
  IconTag,
  IconTypography,
} from "@tabler/icons-react";
import {
  AirtableIcon,
  FigmaIcon,
  FramerIcon,
  GoogleDriveIcon,
  GoogleSheetsIcon,
  LoomIcon,
  MiroIcon,
  TypeformIcon,
  VimeoIcon,
  YoutubeIcon,
} from "@/components/icons";
import { IconColumns4 } from "@/components/icons/icon-columns-4";
import { IconColumns5 } from "@/components/icons/icon-columns-5";
import IconDrawio from "@/components/icons/icon-drawio";
import IconExcalidraw from "@/components/icons/icon-excalidraw";
import IconMermaid from "@/components/icons/icon-mermaid";
import { uploadAttachmentAction } from "@/features/editor/components/attachment/upload-attachment-action.tsx";
import { uploadAudioAction } from "@/features/editor/components/audio/upload-audio-action.tsx";
import { insertBaseEmbedBlock } from "@/features/editor/components/base-embed/insert-base-embed";
import { uploadImageAction } from "@/features/editor/components/image/upload-image-action.tsx";
import { uploadPdfAction } from "@/features/editor/components/pdf/upload-pdf-action.tsx";
import {
  CommandProps,
  SlashMenuGroupedItemsType,
} from "@/features/editor/components/slash-menu/types";
import { uploadVideoAction } from "@/features/editor/components/video/upload-video-action.tsx";
import i18n from "@/i18n.ts";

const CommandGroups: SlashMenuGroupedItemsType = {
  basic: [
    {
      command: ({ editor, range }: CommandProps) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .toggleNode("paragraph", "paragraph")
          .run();
      },
      description: "Just start typing with plain text.",
      icon: IconTypography,
      searchTerms: ["p", "paragraph"],
      title: "Text",
    },
    {
      command: ({ editor, range }: CommandProps) => {
        editor.chain().focus().deleteRange(range).toggleTaskList().run();
      },
      description: "Track tasks with a to-do list.",
      icon: IconCheckbox,
      searchTerms: ["todo", "task", "list", "check", "checkbox"],
      title: "To-do list",
    },
    {
      command: ({ editor, range }: CommandProps) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setNode("heading", { level: 1 })
          .run();
      },
      description: "Big section heading.",
      icon: IconH1,
      searchTerms: ["title", "big", "large"],
      title: "Heading 1",
    },
    {
      command: ({ editor, range }: CommandProps) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setNode("heading", { level: 2 })
          .run();
      },
      description: "Medium section heading.",
      icon: IconH2,
      searchTerms: ["subtitle", "medium"],
      title: "Heading 2",
    },
    {
      command: ({ editor, range }: CommandProps) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setNode("heading", { level: 3 })
          .run();
      },
      description: "Small section heading.",
      icon: IconH3,
      searchTerms: ["subtitle", "small"],
      title: "Heading 3",
    },
    {
      command: ({ editor, range }: CommandProps) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run();
      },
      description: "Create a simple bullet list.",
      icon: IconList,
      searchTerms: ["unordered", "point", "list"],
      title: "Bullet list",
    },
    {
      command: ({ editor, range }: CommandProps) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run();
      },
      description: "Create a list with numbering.",
      icon: IconListNumbers,
      searchTerms: ["numbered", "ordered", "list", "ol"],
      title: "Numbered list",
    },
    {
      command: ({ editor, range }: CommandProps) =>
        editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
      description: "Create block quote.",
      icon: IconBlockquote,
      searchTerms: ["blockquote", "quotes"],
      title: "Quote",
    },
    {
      command: ({ editor, range }: CommandProps) =>
        editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
      description: "Insert code snippet.",
      icon: IconCode,
      searchTerms: ["codeblock"],
      title: "Code",
    },
    {
      command: ({ editor, range }: CommandProps) =>
        editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
      description: "Insert horizontal rule divider",
      icon: IconMenu4,
      searchTerms: ["horizontal rule", "hr"],
      title: "Divider",
    },
    {
      command: ({ editor, range }: CommandProps) =>
        editor.chain().focus().deleteRange(range).setPageBreak().run(),
      description: "Insert a page break for printing.",
      icon: IconPageBreak,
      searchTerms: ["page", "break", "pagebreak", "print"],
      title: "Page break",
    },
    {
      command: ({ editor, range }: CommandProps) => {
        editor.chain().focus().deleteRange(range).run();
        editor.commands.addFootnote();
      },
      description: "Insert a footnote reference.",
      icon: IconSuperscript,
      searchTerms: ["footnote", "reference", "citation", "note"],
      title: "Footnote",
    },
    {
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run();

        // @ts-expect-error
        const pageId = editor.storage?.pageId;
        if (!pageId) {
          return;
        }

        // upload image
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.multiple = true;
        input.style.display = "none";
        document.body.appendChild(input);
        input.onchange = async () => {
          if (input.files?.length) {
            for (const file of input.files) {
              const pos = editor.view.state.selection.from;

              uploadImageAction(file, editor, pos, pageId);
            }
          }

          input.remove();
        };
        input.click();
      },
      description: "Upload any image from your device.",
      icon: IconPhoto,
      searchTerms: ["photo", "picture", "media", "file", "attachment"],
      title: "Image",
    },
    {
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run();

        // @ts-expect-error
        const pageId = editor.storage?.pageId;
        if (!pageId) {
          return;
        }

        // upload video
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "video/*";
        input.multiple = true;
        input.style.display = "none";
        document.body.appendChild(input);
        input.onchange = async () => {
          if (input.files?.length) {
            for (const file of input.files) {
              const pos = editor.view.state.selection.from;

              uploadVideoAction(file, editor, pos, pageId);
            }
          }

          input.remove();
        };
        input.click();
      },
      description: "Upload any video from your device.",
      icon: IconMovie,
      searchTerms: ["video", "mp4", "media", "file", "attachment"],
      title: "Video",
    },
    {
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run();

        // @ts-expect-error
        const pageId = editor.storage?.pageId;
        if (!pageId) {
          return;
        }

        // upload audio
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "audio/*";
        input.multiple = true;
        input.style.display = "none";
        document.body.appendChild(input);
        input.onchange = async () => {
          if (input.files?.length) {
            for (const file of input.files) {
              const pos = editor.view.state.selection.from;

              uploadAudioAction(file, editor, pos, pageId);
            }
          }

          input.remove();
        };
        input.click();
      },
      description: "Upload any audio from your device.",
      icon: IconMusic,
      searchTerms: [
        "audio",
        "music",
        "sound",
        "mp3",
        "media",
        "file",
        "attachment",
      ],
      title: "Audio",
    },
    {
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run();

        // @ts-expect-error
        const pageId = editor.storage?.pageId;
        if (!pageId) {
          return;
        }

        const input = document.createElement("input");
        input.type = "file";
        input.accept = "application/pdf";
        input.style.display = "none";
        document.body.appendChild(input);
        input.onchange = async () => {
          if (input.files?.length) {
            for (const file of input.files) {
              const pos = editor.view.state.selection.from;

              uploadPdfAction(file, editor, pos, pageId);
            }
          }

          input.remove();
        };
        input.click();
      },
      description: "Upload and embed a PDF file.",
      icon: IconFileTypePdf,
      searchTerms: ["pdf", "document", "embed"],
      title: "Embed PDF",
    },
    {
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run();

        // @ts-expect-error
        const pageId = editor.storage?.pageId;
        if (!pageId) {
          return;
        }

        // upload file
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "";
        input.multiple = true;
        input.style.display = "none";
        document.body.appendChild(input);
        input.onchange = async () => {
          if (input.files?.length) {
            for (const file of input.files) {
              const pos = editor.view.state.selection.from;

              uploadAttachmentAction(file, editor, pos, pageId, true);
            }
          }

          input.remove();
        };
        input.click();
      },
      description: "Upload any file from your device.",
      icon: IconPaperclip,
      searchTerms: ["file", "attachment", "upload", "csv", "zip"],
      title: "File attachment",
    },
    {
      command: ({ editor, range }: CommandProps) =>
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertTable({ cols: 3, rows: 3, withHeaderRow: true })
          .run(),
      description: "Insert a table.",
      icon: IconTable,
      searchTerms: ["table", "rows", "columns"],
      title: "Table",
    },
    {
      command: ({ editor, range }: CommandProps) => {
        insertBaseEmbedBlock(editor, { range });
      },
      description: "Insert an inline base on this page",
      icon: IconTable,
      requiresBases: true,
      searchTerms: ["base", "database", "table", "grid", "spreadsheet"],
      title: "Base (Inline)",
    },
    {
      command: ({ editor, range }: CommandProps) => {
        insertBaseEmbedBlock(editor, { range, template: "kanban" });
      },
      description: "Insert a kanban board on this page",
      icon: IconLayoutKanban,
      requiresBases: true,
      searchTerms: ["kanban", "board", "cards", "status", "task", "database"],
      title: "Kanban",
    },
    {
      command: ({ editor, range }: CommandProps) =>
        editor.chain().focus().deleteRange(range).setDetails().run(),
      description: "Insert collapsible block.",
      icon: IconCaretRightFilled,
      searchTerms: ["collapsible", "block", "toggle", "details", "expand"],
      title: "Toggle block",
    },
    {
      command: ({ editor, range }: CommandProps) =>
        editor.chain().focus().deleteRange(range).toggleCallout().run(),
      description: "Insert callout notice.",
      icon: IconInfoCircle,
      searchTerms: [
        "callout",
        "notice",
        "panel",
        "info",
        "warning",
        "success",
        "error",
        "danger",
      ],
      title: "Callout",
    },
    {
      command: ({ editor, range }: CommandProps) =>
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setMathInline()
          .setNodeSelection(range.from)
          .run(),
      description: "Insert inline math equation.",
      icon: IconMathFunction,
      searchTerms: [
        "math",
        "inline",
        "mathinline",
        "inlinemath",
        "inline math",
        "equation",
        "katex",
        "latex",
        "tex",
      ],
      title: "Math inline",
    },
    {
      command: ({ editor, range }: CommandProps) =>
        editor.chain().focus().deleteRange(range).setMathBlock().run(),
      description: "Insert math equation",
      icon: IconMath,
      searchTerms: [
        "math",
        "block",
        "mathblock",
        "block math",
        "equation",
        "katex",
        "latex",
        "tex",
      ],
      title: "Math block",
    },
    {
      command: ({ editor, range }: CommandProps) =>
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setCodeBlock({ language: "mermaid" })
          .insertContent("flowchart LR\n    A --> B")
          .run(),
      description: "Insert mermaid diagram",
      icon: IconMermaid,
      searchTerms: ["mermaid", "diagrams", "chart", "uml"],
      title: "Mermaid diagram",
    },
    {
      command: ({ editor, range }: CommandProps) =>
        editor.chain().focus().deleteRange(range).setDrawio().run(),
      description: "Insert and design Drawio diagrams",
      icon: IconDrawio,
      searchTerms: ["drawio", "diagrams", "charts", "uml", "whiteboard"],
      title: "Draw.io (diagrams.net)",
    },
    {
      command: ({ editor, range }: CommandProps) =>
        editor.chain().focus().deleteRange(range).setExcalidraw().run(),
      description: "Draw and sketch excalidraw diagrams",
      icon: IconExcalidraw,
      searchTerms: ["diagrams", "draw", "sketch", "whiteboard"],
      title: "Excalidraw (Whiteboard)",
    },
    {
      command: ({ editor, range }: CommandProps) => {
        const currentDate = new Date().toLocaleDateString(i18n.language, {
          day: "numeric",
          month: "long",
          year: "numeric",
        });

        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent(currentDate)
          .run();
      },
      description: "Insert current date",
      icon: IconCalendar,
      searchTerms: ["date", "today"],
      title: "Date",
    },
    {
      command: ({ editor, range }: CommandProps) => {
        const currentTime = new Date().toLocaleTimeString(i18n.language, {
          hour: "numeric",
          minute: "numeric",
        });

        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent(currentTime)
          .run();
      },
      description: "Insert current time",
      icon: IconClock,
      searchTerms: ["time", "now", "clock"],
      title: "Time",
    },
    {
      command: ({ editor, range }: CommandProps) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setStatus({ color: "gray", text: "" })
          .run();
      },
      description: "Insert inline status badge.",
      icon: IconTag,
      searchTerms: ["status", "badge", "label", "lozenge"],
      title: "Status",
    },
    {
      command: ({ editor, range }: CommandProps) => {
        editor.chain().focus().deleteRange(range).insertContent(":").run();
      },
      description: "Insert emoji.",
      icon: IconMoodSmile,
      searchTerms: [
        "emoji",
        "icon",
        "smiley",
        "emoticon",
        "symbol",
        "reaction",
      ],
      title: "Emoji",
    },
    {
      command: ({ editor, range }: CommandProps) => {
        editor.chain().focus().deleteRange(range).insertSubpages().run();
      },
      description: "List all subpages of the current page",
      icon: IconSitemap,
      searchTerms: [
        "subpages",
        "child",
        "children",
        "nested",
        "hierarchy",
        "toc",
      ],
      title: "Subpages (Child pages)",
    },
    {
      command: ({ editor, range }: CommandProps) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertTransclusionSource()
          .run();
      },
      description: "Create a block that stays in sync across pages.",
      icon: IconRotate2,
      searchTerms: [
        "sync",
        "synced",
        "synced block",
        "excerpt",
        "transclusion",
        "reusable",
        "snippet",
      ],
      title: "Synced block",
    },
    {
      command: ({ editor, range }: CommandProps) =>
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertColumns({ layout: "two_equal" })
          .run(),
      description: "Split content into two columns.",
      icon: IconColumns2,
      searchTerms: ["columns", "layout", "split", "side"],
      title: "2 Columns",
    },
    {
      command: ({ editor, range }: CommandProps) =>
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertColumns({ layout: "three_equal" })
          .run(),
      description: "Split content into three columns.",
      icon: IconColumns3,
      searchTerms: ["columns", "layout", "split", "triple"],
      title: "3 Columns",
    },
    {
      command: ({ editor, range }: CommandProps) =>
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertColumns({ layout: "four_equal" })
          .run(),
      description: "Split content into four columns.",
      icon: IconColumns4,
      searchTerms: ["columns", "layout", "split"],
      title: "4 Columns",
    },
    {
      command: ({ editor, range }: CommandProps) =>
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertColumns({ layout: "five_equal" })
          .run(),
      description: "Split content into five columns.",
      icon: IconColumns5,
      searchTerms: ["columns", "layout", "split"],
      title: "5 Columns",
    },
    {
      command: ({ editor, range }: CommandProps) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setEmbed({ provider: "iframe" })
          .run();
      },
      description: "Embed any Iframe",
      icon: IconAppWindow,
      searchTerms: ["iframe"],
      title: "Iframe embed",
    },
    {
      command: ({ editor, range }: CommandProps) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setEmbed({ provider: "airtable" })
          .run();
      },
      description: "Embed Airtable",
      icon: AirtableIcon,
      searchTerms: ["airtable"],
      title: "Airtable",
    },
    {
      command: ({ editor, range }: CommandProps) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setEmbed({ provider: "loom" })
          .run();
      },
      description: "Embed Loom video",
      icon: LoomIcon,
      searchTerms: ["loom"],
      title: "Loom",
    },
    {
      command: ({ editor, range }: CommandProps) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setEmbed({ provider: "figma" })
          .run();
      },
      description: "Embed Figma files",
      icon: FigmaIcon,
      searchTerms: ["figma"],
      title: "Figma",
    },
    {
      command: ({ editor, range }: CommandProps) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setEmbed({ provider: "typeform" })
          .run();
      },
      description: "Embed Typeform",
      icon: TypeformIcon,
      searchTerms: ["typeform"],
      title: "Typeform",
    },
    {
      command: ({ editor, range }: CommandProps) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setEmbed({ provider: "miro" })
          .run();
      },
      description: "Embed Miro board",
      icon: MiroIcon,
      searchTerms: ["miro"],
      title: "Miro",
    },
    {
      command: ({ editor, range }: CommandProps) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setEmbed({ provider: "youtube" })
          .run();
      },
      description: "Embed YouTube video",
      icon: YoutubeIcon,
      searchTerms: ["youtube", "yt", "media", "video"],
      title: "YouTube",
    },
    {
      command: ({ editor, range }: CommandProps) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setEmbed({ provider: "vimeo" })
          .run();
      },
      description: "Embed Vimeo video",
      icon: VimeoIcon,
      searchTerms: ["vimeo"],
      title: "Vimeo",
    },
    {
      command: ({ editor, range }: CommandProps) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setEmbed({ provider: "framer" })
          .run();
      },
      description: "Embed Framer prototype",
      icon: FramerIcon,
      searchTerms: ["framer"],
      title: "Framer",
    },
    {
      command: ({ editor, range }: CommandProps) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setEmbed({ provider: "gdrive" })
          .run();
      },
      description: "Embed Google Drive content",
      icon: GoogleDriveIcon,
      searchTerms: ["google drive", "gdrive"],
      title: "Google Drive",
    },
    {
      command: ({ editor, range }: CommandProps) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setEmbed({ provider: "gsheets" })
          .run();
      },
      description: "Embed Google Sheets content",
      icon: GoogleSheetsIcon,
      searchTerms: ["google sheets", "gsheets"],
      title: "Google Sheets",
    },
  ],
};

export const getSuggestionItems = ({
  query,
  excludeItems,
}: {
  query: string;
  excludeItems?: Set<string>;
}): SlashMenuGroupedItemsType => {
  const search = query.toLowerCase();
  const filteredGroups: SlashMenuGroupedItemsType = {};

  const fuzzyMatch = (query: string, target: string) => {
    let queryIndex = 0;
    target = target.toLowerCase();
    for (const char of target) {
      if (query[queryIndex] === char) {
        queryIndex++;
      }
      if (queryIndex === query.length) {
        return true;
      }
    }
    return false;
  };

  for (const [group, items] of Object.entries(CommandGroups)) {
    const filteredItems = items.filter((item) => {
      if (excludeItems?.has(item.title)) {
        return false;
      }
      const translatedTitle = i18n.t(item.title);
      const translatedDescription = i18n.t(item.description);
      return (
        fuzzyMatch(search, item.title) ||
        fuzzyMatch(search, translatedTitle) ||
        item.description.toLowerCase().includes(search) ||
        translatedDescription.toLowerCase().includes(search) ||
        (item.searchTerms &&
          item.searchTerms.some(
            (term: string) =>
              term.includes(search) ||
              i18n.t(term).toLowerCase().includes(search)
          ))
      );
    });

    if (filteredItems.length) {
      filteredGroups[group] = filteredItems.sort((a, b) => {
        const aTitle =
          a.title.toLowerCase().includes(search) ||
          i18n.t(a.title).toLowerCase().includes(search)
            ? 0
            : 1;
        const bTitle =
          b.title.toLowerCase().includes(search) ||
          i18n.t(b.title).toLowerCase().includes(search)
            ? 0
            : 1;
        return aTitle - bTitle;
      });
    }
  }

  return filteredGroups;
};

export default getSuggestionItems;
