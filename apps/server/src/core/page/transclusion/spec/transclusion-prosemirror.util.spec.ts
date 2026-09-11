import {
  collectReferencesFromPmJson,
  collectTransclusionsFromPmJson,
} from "../utils/transclusion-prosemirror.util";

describe("collectTransclusionsFromPmJson", () => {
  it("returns [] for null/undefined doc", () => {
    expect(collectTransclusionsFromPmJson(null)).toEqual([]);
    expect(collectTransclusionsFromPmJson(undefined)).toEqual([]);
  });

  it("returns [] for a doc with no transclusion nodes", () => {
    const doc = {
      content: [{ content: [{ text: "hi", type: "text" }], type: "paragraph" }],
      type: "doc",
    };
    expect(collectTransclusionsFromPmJson(doc)).toEqual([]);
  });

  it("extracts a top-level transclusion with id and content", () => {
    const doc = {
      content: [
        {
          attrs: { id: "abc123" },
          content: [
            { content: [{ text: "Body", type: "text" }], type: "paragraph" },
          ],
          type: "transclusionSource",
        },
      ],
      type: "doc",
    };
    const got = collectTransclusionsFromPmJson(doc);
    expect(got).toHaveLength(1);
    expect(got[0].transclusionId).toBe("abc123");
    expect(got[0].content).toEqual({
      content: [
        { content: [{ text: "Body", type: "text" }], type: "paragraph" },
      ],
      type: "doc",
    });
  });

  it("skips transclusion nodes with no id (transient before UniqueID assigns one)", () => {
    const doc = {
      content: [
        {
          attrs: {},
          content: [{ type: "paragraph" }],
          type: "transclusionSource",
        },
      ],
      type: "doc",
    };
    expect(collectTransclusionsFromPmJson(doc)).toEqual([]);
  });

  it("returns multiple top-level transclusions", () => {
    const doc = {
      content: [
        {
          attrs: { id: "a" },
          content: [{ type: "paragraph" }],
          type: "transclusionSource",
        },
        {
          attrs: { id: "b" },
          content: [{ type: "paragraph" }],
          type: "transclusionSource",
        },
      ],
      type: "doc",
    };
    const got = collectTransclusionsFromPmJson(doc);
    expect(got.map((e) => e.transclusionId)).toEqual(["a", "b"]);
  });

  it("does not recurse into a nested transclusion (transclusion cannot contain transclusion per schema, but be defensive)", () => {
    const doc = {
      content: [
        {
          attrs: { id: "outer" },
          content: [
            {
              attrs: { id: "inner" },
              content: [{ type: "paragraph" }],
              type: "transclusionSource",
            },
          ],
          type: "transclusionSource",
        },
      ],
      type: "doc",
    };
    const got = collectTransclusionsFromPmJson(doc);
    expect(got.map((e) => e.transclusionId)).toEqual(["outer"]);
  });

  it("finds transclusions nested inside other block containers (e.g. column)", () => {
    const doc = {
      content: [
        {
          content: [
            {
              attrs: { id: "inCol" },
              content: [{ type: "paragraph" }],
              type: "transclusionSource",
            },
          ],
          type: "column",
        },
      ],
      type: "doc",
    };
    expect(
      collectTransclusionsFromPmJson(doc).map((e) => e.transclusionId)
    ).toEqual(["inCol"]);
  });

  it("uses the last id when duplicate ids appear (later wins, deterministic)", () => {
    const doc = {
      content: [
        {
          attrs: { id: "dup" },
          content: [
            { content: [{ text: "first", type: "text" }], type: "paragraph" },
          ],
          type: "transclusionSource",
        },
        {
          attrs: { id: "dup" },
          content: [
            { content: [{ text: "second", type: "text" }], type: "paragraph" },
          ],
          type: "transclusionSource",
        },
      ],
      type: "doc",
    };
    const got = collectTransclusionsFromPmJson(doc);
    expect(got).toHaveLength(1);
    expect(got[0].content).toEqual({
      content: [
        { content: [{ text: "second", type: "text" }], type: "paragraph" },
      ],
      type: "doc",
    });
  });
});

describe("collectReferencesFromPmJson", () => {
  it("returns [] for null/undefined doc", () => {
    expect(collectReferencesFromPmJson(null)).toEqual([]);
    expect(collectReferencesFromPmJson(undefined)).toEqual([]);
  });

  it("returns [] for a doc with no transclusionReference nodes", () => {
    const doc = {
      content: [{ content: [{ text: "hi", type: "text" }], type: "paragraph" }],
      type: "doc",
    };
    expect(collectReferencesFromPmJson(doc)).toEqual([]);
  });

  it("extracts a top-level reference", () => {
    const doc = {
      content: [
        {
          attrs: { sourcePageId: "p1", transclusionId: "e1" },
          type: "transclusionReference",
        },
      ],
      type: "doc",
    };
    expect(collectReferencesFromPmJson(doc)).toEqual([
      { sourcePageId: "p1", transclusionId: "e1" },
    ]);
  });

  it("skips references missing sourcePageId or transclusionId", () => {
    const doc = {
      content: [
        { attrs: { transclusionId: "e1" }, type: "transclusionReference" },
        { attrs: { sourcePageId: "p1" }, type: "transclusionReference" },
        { attrs: {}, type: "transclusionReference" },
      ],
      type: "doc",
    };
    expect(collectReferencesFromPmJson(doc)).toEqual([]);
  });

  it("finds references nested in other block containers (column, callout, etc.)", () => {
    const doc = {
      content: [
        {
          content: [
            {
              attrs: { sourcePageId: "p1", transclusionId: "e1" },
              type: "transclusionReference",
            },
          ],
          type: "column",
        },
        {
          content: [
            {
              attrs: { sourcePageId: "p2", transclusionId: "e2" },
              type: "transclusionReference",
            },
          ],
          type: "callout",
        },
      ],
      type: "doc",
    };
    expect(collectReferencesFromPmJson(doc)).toEqual([
      { sourcePageId: "p1", transclusionId: "e1" },
      { sourcePageId: "p2", transclusionId: "e2" },
    ]);
  });

  it("does not recurse into a transclusion source (schema forbids references inside)", () => {
    const doc = {
      content: [
        {
          attrs: { id: "src1" },
          content: [
            {
              attrs: { sourcePageId: "p1", transclusionId: "e1" },
              type: "transclusionReference",
            },
          ],
          type: "transclusionSource",
        },
      ],
      type: "doc",
    };
    expect(collectReferencesFromPmJson(doc)).toEqual([]);
  });

  it("dedupes identical (sourcePageId, transclusionId) pairs", () => {
    const doc = {
      content: [
        {
          attrs: { sourcePageId: "p1", transclusionId: "e1" },
          type: "transclusionReference",
        },
        {
          attrs: { sourcePageId: "p1", transclusionId: "e1" },
          type: "transclusionReference",
        },
        {
          attrs: { sourcePageId: "p2", transclusionId: "e2" },
          type: "transclusionReference",
        },
      ],
      type: "doc",
    };
    expect(collectReferencesFromPmJson(doc)).toEqual([
      { sourcePageId: "p1", transclusionId: "e1" },
      { sourcePageId: "p2", transclusionId: "e2" },
    ]);
  });
});
