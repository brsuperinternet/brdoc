import {
  type AttachmentRewritePlan,
  rewriteAttachmentsForUnsync,
} from "../utils/transclusion-unsync.util";

describe("rewriteAttachmentsForUnsync", () => {
  const fixedIds = () => {
    let i = 0;
    return () => `new-${++i}`;
  };

  it("returns content unchanged when no attachment nodes are present", () => {
    const content = {
      content: [
        { content: [{ text: "hello", type: "text" }], type: "paragraph" },
      ],
      type: "doc",
    };
    const r = rewriteAttachmentsForUnsync(content, fixedIds());
    expect(r.content).toEqual(content);
    expect(r.copies).toEqual([]);
  });

  it("rewrites attachmentId and src on a single image node", () => {
    const oldId = "11111111-1111-1111-1111-111111111111";
    const content = {
      content: [
        {
          attrs: {
            attachmentId: oldId,
            src: `/api/files/${oldId}/cat.png`,
          },
          type: "image",
        },
      ],
      type: "doc",
    };
    const gen = fixedIds();
    const r = rewriteAttachmentsForUnsync(content, gen);

    expect(r.copies).toHaveLength(1);
    const plan: AttachmentRewritePlan = r.copies[0];
    expect(plan.oldAttachmentId).toBe(oldId);
    expect(plan.newAttachmentId).toBe("new-1");

    const img = (r.content as any).content[0];
    expect(img.attrs.attachmentId).toBe("new-1");
    expect(img.attrs.src).toBe("/api/files/new-1/cat.png");
  });

  it("rewrites every attachment node type (image, video, audio, attachment, drawio, excalidraw, pdf)", () => {
    const types = [
      "image",
      "video",
      "audio",
      "attachment",
      "drawio",
      "excalidraw",
      "pdf",
    ] as const;
    const content = {
      content: types.map((t, i) => ({
        attrs: {
          attachmentId: `old-${i}`,
          src: `/api/files/old-${i}/file`,
        },
        type: t,
      })),
      type: "doc",
    };
    const r = rewriteAttachmentsForUnsync(content, fixedIds());
    expect(r.copies).toHaveLength(types.length);
    expect(
      (r.content as any).content.map((n: any) => n.attrs.attachmentId)
    ).toEqual(Array.from({ length: types.length }, (_, i) => `new-${i + 1}`));
  });

  it("reuses one new id per old attachmentId across nodes (dedupe)", () => {
    const shared = "shared-old";
    const content = {
      content: [
        {
          attrs: {
            attachmentId: shared,
            src: `/api/files/${shared}/a.png`,
          },
          type: "image",
        },
        {
          attrs: {
            attachmentId: shared,
            src: `/api/files/${shared}/a.png`,
          },
          type: "image",
        },
      ],
      type: "doc",
    };
    const r = rewriteAttachmentsForUnsync(content, fixedIds());
    expect(r.copies).toHaveLength(1);
    expect(r.copies[0].oldAttachmentId).toBe(shared);
    const newId = r.copies[0].newAttachmentId;
    expect((r.content as any).content[0].attrs.attachmentId).toBe(newId);
    expect((r.content as any).content[1].attrs.attachmentId).toBe(newId);
  });

  it("does not mutate the input content object", () => {
    const content = {
      content: [
        {
          attrs: { attachmentId: "old-x", src: "/api/files/old-x/x.png" },
          type: "image",
        },
      ],
      type: "doc",
    };
    const snapshot = JSON.parse(JSON.stringify(content));
    rewriteAttachmentsForUnsync(content, fixedIds());
    expect(content).toEqual(snapshot);
  });

  it("skips nodes whose attachmentId is missing or not a uuid-shaped string", () => {
    const content = {
      content: [
        { attrs: {}, type: "image" },
        { attrs: { attachmentId: "" }, type: "image" },
      ],
      type: "doc",
    };
    const r = rewriteAttachmentsForUnsync(content, fixedIds());
    expect(r.copies).toEqual([]);
    expect(r.content).toEqual(content);
  });

  it("recurses into nested containers (column, callout)", () => {
    const oldId = "old-nested";
    const content = {
      content: [
        {
          content: [
            {
              attrs: {
                attachmentId: oldId,
                src: `/api/files/${oldId}/x.png`,
              },
              type: "image",
            },
          ],
          type: "callout",
        },
      ],
      type: "doc",
    };
    const r = rewriteAttachmentsForUnsync(content, fixedIds());
    expect(r.copies).toHaveLength(1);
    const newId = r.copies[0].newAttachmentId;
    const inner = (r.content as any).content[0].content[0];
    expect(inner.attrs.attachmentId).toBe(newId);
    expect(inner.attrs.src).toBe(`/api/files/${newId}/x.png`);
  });
});
