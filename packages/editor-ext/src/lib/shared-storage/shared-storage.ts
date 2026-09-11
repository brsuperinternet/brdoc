import { Extension } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Storage {
    shared: Record<string, any>;
  }
}

const SharedStorage = Extension.create({
  addStorage() {
    return {};
  },
  name: "shared",
});

export { SharedStorage };
