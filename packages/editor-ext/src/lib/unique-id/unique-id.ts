import { UniqueID as TiptapUniqueID } from "@tiptap/extension-unique-id";
import { generateNodeId } from "../utils";

export const UniqueID = TiptapUniqueID.extend({
  addOptions() {
    return {
      ...this.parent?.(),
      generateID: () => generateNodeId(),
    };
  },
});
