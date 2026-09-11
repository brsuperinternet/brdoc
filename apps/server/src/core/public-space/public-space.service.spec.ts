import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { Feature } from "../../common/features";
import { PublicSpaceService } from "./public-space.service";

const WORKSPACE_ID = "018f0000-0000-7000-8000-000000000001";
const SPACE_ID = "018f0000-0000-7000-8000-000000000002";

function makeWorkspace(settings: any = {}) {
  return { id: WORKSPACE_ID, settings } as any;
}

const optInSettings = { publicSpaces: { enabled: true } };

function makeService(overrides: any = {}) {
  const publicSpaceRepo = {
    findBySpaceId: jest.fn().mockResolvedValue({
      enabled: true,
      id: "ps1",
      searchIndexing: false,
      spaceId: SPACE_ID,
    }),
    upsert: jest.fn().mockImplementation(async (opts) => opts),
    ...overrides.publicSpaceRepo,
  };
  const spaceRepo = {
    findBySlug: jest.fn().mockResolvedValue({
      deletedAt: null,
      id: SPACE_ID,
      name: "Handbook",
      slug: "handbook",
      workspaceId: WORKSPACE_ID,
    }),
    ...overrides.spaceRepo,
  };
  const pageRepo = {
    findById: jest.fn().mockResolvedValue({
      content: null,
      deletedAt: null,
      id: "page1",
      slugId: "abc123XYZ0",
      spaceId: SPACE_ID,
      workspaceId: WORKSPACE_ID,
    }),
    getFirstUnrestrictedRootPage: jest
      .fn()
      .mockResolvedValue({ id: "page1", slugId: "abc123XYZ0" }),
    getSpacePagesExcludingRestricted: jest.fn().mockResolvedValue([]),
    ...overrides.pageRepo,
  };
  const pagePermissionRepo = {
    hasRestrictedAncestor: jest.fn().mockResolvedValue(false),
    ...overrides.pagePermissionRepo,
  };
  const shareService = {
    sanitizeTransclusionItemsForPublic: jest
      .fn()
      .mockImplementation(async (items) => items),
    updatePublicAttachments: jest
      .fn()
      .mockImplementation(async (p) => p.content),
    ...overrides.shareService,
  };
  const transclusionService = {
    lookupWithAccessSet: jest.fn().mockResolvedValue({ items: [] }),
    ...overrides.transclusionService,
  };

  const licenseCheckService = {
    resolveFeatures: jest
      .fn()
      .mockReturnValue([Feature.PUBLIC_SPACE_APPEARANCE]),
    ...overrides.licenseCheckService,
  };

  const environmentService = {
    isBetaPublicSpaces: jest.fn().mockReturnValue(true),
    ...overrides.environmentService,
  };

  const service = new PublicSpaceService(
    publicSpaceRepo as any,
    spaceRepo as any,
    pageRepo as any,
    pagePermissionRepo as any,
    shareService as any,
    transclusionService as any,
    licenseCheckService as any,
    environmentService as any
  );
  return {
    environmentService,
    licenseCheckService,
    pagePermissionRepo,
    pageRepo,
    publicSpaceRepo,
    service,
    shareService,
    spaceRepo,
    transclusionService,
  };
}

describe("PublicSpaceService", () => {
  describe("getPublicSpace", () => {
    it("404s when the workspace opt-in is off (default)", async () => {
      const { service } = makeService();
      await expect(
        service.getPublicSpace("handbook", makeWorkspace({}))
      ).rejects.toThrow(NotFoundException);
    });

    it("404s when BETA_PUBLIC_SPACES is off even with the workspace opt-in on", async () => {
      const { service, spaceRepo } = makeService({
        environmentService: {
          isBetaPublicSpaces: jest.fn().mockReturnValue(false),
        },
      });
      const ws = makeWorkspace({ publicSpaces: { enabled: true } });
      await expect(service.getPublicSpace("handbook", ws)).rejects.toThrow(
        NotFoundException
      );
      expect(spaceRepo.findBySlug).not.toHaveBeenCalled();
    });

    it("resolves when public page sharing is disabled", async () => {
      const { service } = makeService();
      const ws = makeWorkspace({
        publicSpaces: { enabled: true },
        sharing: { disabled: true },
      });
      const result = await service.getPublicSpace("handbook", ws);

      expect(result.space.id).toBe(SPACE_ID);
      expect(result.publicSpace.enabled).toBe(true);
    });

    it("404s when the space row is disabled", async () => {
      const { service } = makeService({
        publicSpaceRepo: {
          findBySpaceId: jest.fn().mockResolvedValue({ enabled: false }),
        },
      });
      await expect(
        service.getPublicSpace("handbook", makeWorkspace(optInSettings))
      ).rejects.toThrow(NotFoundException);
    });

    it("404s when there is no public_spaces row", async () => {
      const { service } = makeService({
        publicSpaceRepo: {
          findBySpaceId: jest.fn().mockResolvedValue(undefined),
        },
      });
      await expect(
        service.getPublicSpace("handbook", makeWorkspace(optInSettings))
      ).rejects.toThrow(NotFoundException);
    });

    it("404s when the space is deleted", async () => {
      const { service } = makeService({
        spaceRepo: {
          findBySlug: jest
            .fn()
            .mockResolvedValue({ deletedAt: new Date(), id: SPACE_ID }),
        },
      });
      await expect(
        service.getPublicSpace("handbook", makeWorkspace(optInSettings))
      ).rejects.toThrow(NotFoundException);
    });

    it("resolves when opted in, enabled, and space exists", async () => {
      const { service } = makeService();
      const result = await service.getPublicSpace(
        "handbook",
        makeWorkspace(optInSettings)
      );
      expect(result.space.id).toBe(SPACE_ID);
      expect(result.publicSpace.enabled).toBe(true);
    });
  });

  describe("getPublicPage", () => {
    it("404s for a page belonging to another space", async () => {
      const { service } = makeService({
        pageRepo: {
          findById: jest.fn().mockResolvedValue({
            deletedAt: null,
            id: "page2",
            spaceId: "other-space",
          }),
        },
      });
      await expect(
        service.getPublicPage(
          "handbook",
          "abc123XYZ0",
          makeWorkspace(optInSettings)
        )
      ).rejects.toThrow(NotFoundException);
    });

    it("404s for a restricted page", async () => {
      const { service } = makeService({
        pagePermissionRepo: {
          hasRestrictedAncestor: jest.fn().mockResolvedValue(true),
        },
      });
      await expect(
        service.getPublicPage(
          "handbook",
          "abc123XYZ0",
          makeWorkspace(optInSettings)
        )
      ).rejects.toThrow(NotFoundException);
    });

    it("resolves the first unrestricted root page as the home", async () => {
      const { service, pageRepo } = makeService();
      const result = await service.getPublicPage(
        "handbook",
        undefined,
        makeWorkspace(optInSettings)
      );
      expect(pageRepo.getFirstUnrestrictedRootPage).toHaveBeenCalledWith(
        SPACE_ID
      );
      expect(result.page.id).toBe("page1");
    });

    it("sanitizes the served page content for public delivery", async () => {
      const sanitizedDoc = { sanitized: true, type: "doc" };
      const { service, shareService } = makeService({
        pageRepo: {
          findById: jest.fn().mockResolvedValue({
            content: { content: [], type: "doc" },
            deletedAt: null,
            id: "page1",
            slugId: "abc123XYZ0",
            spaceId: SPACE_ID,
            workspaceId: WORKSPACE_ID,
          }),
        },
        shareService: {
          updatePublicAttachments: jest.fn().mockResolvedValue(sanitizedDoc),
        },
      });

      const result = await service.getPublicPage(
        "handbook",
        "abc123XYZ0",
        makeWorkspace(optInSettings)
      );

      expect(shareService.updatePublicAttachments.mock.calls[0][0]).toBe(
        result.page
      );
      expect(result.page.content).toBe(sanitizedDoc);
    });

    it("returns page null for an empty published space", async () => {
      const { service } = makeService({
        pageRepo: {
          getFirstUnrestrictedRootPage: jest.fn().mockResolvedValue(undefined),
        },
      });
      const result = await service.getPublicPage(
        "handbook",
        undefined,
        makeWorkspace(optInSettings)
      );
      expect(result.page).toBeNull();
    });

    it("skips content preparation when includeContent is false", async () => {
      const { service, pageRepo, shareService } = makeService();

      const result = await service.getPublicPage(
        "handbook",
        "abc123XYZ0",
        makeWorkspace(optInSettings),
        { includeContent: false }
      );

      expect(pageRepo.findById).toHaveBeenCalledWith("abc123XYZ0");
      expect(shareService.updatePublicAttachments).not.toHaveBeenCalled();
      expect(result.page.id).toBe("page1");
    });
  });

  describe("lookupTransclusionForPublicSpace", () => {
    const refs = [{ sourcePageId: "ref1", transclusionId: "t1" }];

    it("excludes a candidate from another space", async () => {
      const { service, transclusionService } = makeService({
        pageRepo: {
          findById: jest.fn().mockResolvedValue({
            deletedAt: null,
            id: "page2",
            spaceId: "other-space",
          }),
        },
      });

      await service.lookupTransclusionForPublicSpace(
        "handbook",
        refs,
        makeWorkspace(optInSettings)
      );

      const accessSet =
        transclusionService.lookupWithAccessSet.mock.calls[0][1];
      expect(Array.from(accessSet)).toEqual([]);
    });

    it("excludes a restricted candidate", async () => {
      const { service, transclusionService } = makeService({
        pagePermissionRepo: {
          hasRestrictedAncestor: jest.fn().mockResolvedValue(true),
        },
      });

      await service.lookupTransclusionForPublicSpace(
        "handbook",
        refs,
        makeWorkspace(optInSettings)
      );

      const accessSet =
        transclusionService.lookupWithAccessSet.mock.calls[0][1];
      expect(Array.from(accessSet)).toEqual([]);
    });

    it("includes a valid same-space candidate by its page id", async () => {
      const { service, transclusionService } = makeService();

      await service.lookupTransclusionForPublicSpace(
        "handbook",
        refs,
        makeWorkspace(optInSettings)
      );

      const accessSet =
        transclusionService.lookupWithAccessSet.mock.calls[0][1];
      expect(Array.from(accessSet)).toEqual(["page1"]);
    });

    it("delegates item sanitization to the share service", async () => {
      const rawItems = [
        { sourcePageId: "page1", status: "not_found", transclusionId: "t1" },
      ];
      const sanitizedItems = [
        { sourcePageId: "page1", status: "no_access", transclusionId: "t1" },
      ];
      const { service, shareService } = makeService({
        shareService: {
          sanitizeTransclusionItemsForPublic: jest
            .fn()
            .mockResolvedValue(sanitizedItems),
        },
        transclusionService: {
          lookupWithAccessSet: jest.fn().mockResolvedValue({ items: rawItems }),
        },
      });

      const result = await service.lookupTransclusionForPublicSpace(
        "handbook",
        refs,
        makeWorkspace(optInSettings)
      );

      expect(
        shareService.sanitizeTransclusionItemsForPublic
      ).toHaveBeenCalledWith(rawItems, WORKSPACE_ID);
      expect(result.items).toBe(sanitizedItems);
    });
  });

  describe("BETA_PUBLIC_SPACES off", () => {
    const flagOff = {
      environmentService: {
        isBetaPublicSpaces: jest.fn().mockReturnValue(false),
      },
    };
    const refs = [{ sourcePageId: "ref1", transclusionId: "t1" }];

    it.each([
      ["getPublicSpaceInfo", (s, ws) => s.getPublicSpaceInfo("handbook", ws)],
      ["getPublicSpaceTree", (s, ws) => s.getPublicSpaceTree("handbook", ws)],
      [
        "getPublicPage",
        (s, ws) => s.getPublicPage("handbook", "abc123XYZ0", ws),
      ],
      [
        "lookupTransclusionForPublicSpace",
        (s, ws) => s.lookupTransclusionForPublicSpace("handbook", refs, ws),
      ],
    ])(
      "%s 404s before any lookup even with the workspace opted in",
      async (_name, call) => {
        const { service, spaceRepo, publicSpaceRepo, pageRepo } =
          makeService(flagOff);
        await expect(
          call(service, makeWorkspace(optInSettings))
        ).rejects.toBeInstanceOf(NotFoundException);
        expect(spaceRepo.findBySlug).not.toHaveBeenCalled();
        expect(publicSpaceRepo.findBySpaceId).not.toHaveBeenCalled();
        expect(pageRepo.findById).not.toHaveBeenCalled();
        expect(
          pageRepo.getSpacePagesExcludingRestricted
        ).not.toHaveBeenCalled();
      }
    );

    it("directory 404s before any lookup even with the double opt-in on", async () => {
      const findEnabledWithSpaceByWorkspaceId = jest.fn().mockResolvedValue([]);
      const { service } = makeService({
        ...flagOff,
        publicSpaceRepo: { findEnabledWithSpaceByWorkspaceId },
      });
      await expect(
        service.getPublicSpaceDirectory(
          makeWorkspace({ publicSpaces: { directory: true, enabled: true } })
        )
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(findEnabledWithSpaceByWorkspaceId).not.toHaveBeenCalled();
    });

    it.each([true, false])(
      "publish rejects every write (enabled=%s) without touching the row",
      async (enabled) => {
        const { service, publicSpaceRepo } = makeService(flagOff);
        await expect(
          service.publish({
            authUserId: "u1",
            enabled,
            space: { id: SPACE_ID, workspaceId: WORKSPACE_ID } as any,
            workspace: makeWorkspace(optInSettings),
          })
        ).rejects.toBeInstanceOf(ForbiddenException);
        expect(publicSpaceRepo.findBySpaceId).not.toHaveBeenCalled();
        expect(publicSpaceRepo.upsert).not.toHaveBeenCalled();
      }
    );
  });

  describe("publish appearance", () => {
    it("merges appearance into existing settings preserving unknown keys", async () => {
      const { service, publicSpaceRepo } = makeService({
        publicSpaceRepo: {
          findBySpaceId: jest.fn().mockResolvedValue({
            enabled: true,
            id: "ps1",
            searchIndexing: false,
            settings: {
              appearance: { primaryColorLight: "#111111" },
              future: 1,
            },
            spaceId: SPACE_ID,
          }),
        },
      });

      await service.publish({
        appearance: { primaryColorDark: "#222222" },
        authUserId: "u1",
        enabled: true,
        space: { id: SPACE_ID, workspaceId: WORKSPACE_ID } as any,
        workspace: makeWorkspace(optInSettings),
      });

      expect(publicSpaceRepo.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: {
            appearance: {
              primaryColorDark: "#222222",
              primaryColorLight: "#111111",
            },
            future: 1,
          },
        })
      );
    });

    it("deletes an appearance key when its value is null", async () => {
      const { service, publicSpaceRepo } = makeService({
        publicSpaceRepo: {
          findBySpaceId: jest.fn().mockResolvedValue({
            enabled: true,
            id: "ps1",
            searchIndexing: false,
            settings: {
              appearance: {
                primaryColorDark: "#222222",
                primaryColorLight: "#111111",
              },
            },
            spaceId: SPACE_ID,
          }),
        },
      });

      await service.publish({
        appearance: { primaryColorLight: null },
        authUserId: "u1",
        enabled: true,
        space: { id: SPACE_ID, workspaceId: WORKSPACE_ID } as any,
        workspace: makeWorkspace(optInSettings),
      });

      expect(publicSpaceRepo.upsert.mock.calls[0][0].settings).toEqual({
        appearance: { primaryColorDark: "#222222" },
      });
    });

    it("passes settings undefined when appearance is omitted", async () => {
      const { service, publicSpaceRepo } = makeService();

      await service.publish({
        authUserId: "u1",
        enabled: true,
        space: { id: SPACE_ID, workspaceId: WORKSPACE_ID } as any,
        workspace: makeWorkspace(optInSettings),
      });

      expect(publicSpaceRepo.upsert.mock.calls[0][0].settings).toBeUndefined();
    });

    it("rejects appearance when the workspace lacks the license feature", async () => {
      const { service, publicSpaceRepo } = makeService({
        licenseCheckService: { resolveFeatures: jest.fn().mockReturnValue([]) },
      });

      await expect(
        service.publish({
          appearance: { primaryColorLight: "#111111" },
          authUserId: "u1",
          enabled: true,
          space: { id: SPACE_ID, workspaceId: WORKSPACE_ID } as any,
          workspace: makeWorkspace(optInSettings),
        })
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(publicSpaceRepo.upsert).not.toHaveBeenCalled();
    });
  });

  describe("public appearance exposure", () => {
    const storedSettings = {
      appearance: {
        internal: "secret",
        primaryColorDark: "#222222",
        primaryColorLight: "#111111",
      },
      future: 1,
    };
    const publicAppearance = {
      primaryColorDark: "#222222",
      primaryColorLight: "#111111",
    };
    const publicSpaceRepoWithSettings = {
      findBySpaceId: jest.fn().mockResolvedValue({
        enabled: true,
        id: "ps1",
        searchIndexing: false,
        settings: storedSettings,
        spaceId: SPACE_ID,
      }),
    };

    it("whitelists appearance on getPublicSpaceInfo", async () => {
      const { service } = makeService({
        publicSpaceRepo: publicSpaceRepoWithSettings,
      });
      const result = await service.getPublicSpaceInfo(
        "handbook",
        makeWorkspace(optInSettings)
      );
      expect(result.appearance).toEqual(publicAppearance);
      expect(result).not.toHaveProperty("settings");
    });

    it("whitelists appearance on getPublicSpaceTree", async () => {
      const { service } = makeService({
        publicSpaceRepo: publicSpaceRepoWithSettings,
      });
      const result = await service.getPublicSpaceTree(
        "handbook",
        makeWorkspace(optInSettings)
      );
      expect(result.appearance).toEqual(publicAppearance);
      expect(result).not.toHaveProperty("settings");
    });

    it("whitelists appearance on the served page response", async () => {
      const { service } = makeService({
        publicSpaceRepo: publicSpaceRepoWithSettings,
      });
      const result = await service.getPublicPage(
        "handbook",
        "abc123XYZ0",
        makeWorkspace(optInSettings)
      );
      expect(result.appearance).toEqual(publicAppearance);
      expect(result).not.toHaveProperty("settings");
    });

    it("whitelists appearance on the empty-space page response", async () => {
      const { service } = makeService({
        pageRepo: {
          getFirstUnrestrictedRootPage: jest.fn().mockResolvedValue(undefined),
        },
        publicSpaceRepo: publicSpaceRepoWithSettings,
      });
      const result = await service.getPublicPage(
        "handbook",
        undefined,
        makeWorkspace(optInSettings)
      );
      expect(result.page).toBeNull();
      expect(result.appearance).toEqual(publicAppearance);
      expect(result).not.toHaveProperty("settings");
    });

    it("strips appearance when the workspace lacks the license feature", async () => {
      const { service } = makeService({
        licenseCheckService: { resolveFeatures: jest.fn().mockReturnValue([]) },
        publicSpaceRepo: publicSpaceRepoWithSettings,
      });
      const result = await service.getPublicSpaceInfo(
        "handbook",
        makeWorkspace(optInSettings)
      );
      expect(result.appearance).toBeUndefined();
    });

    it("omits appearance when none is stored", async () => {
      const { service } = makeService();
      const result = await service.getPublicSpaceInfo(
        "handbook",
        makeWorkspace(optInSettings)
      );
      expect(result.appearance ?? {}).toEqual({});
    });
  });

  describe("byline", () => {
    function makeRepoWithByline(byline: any) {
      return {
        findBySpaceId: jest.fn().mockResolvedValue({
          enabled: true,
          id: "ps1",
          searchIndexing: false,
          settings: byline === null ? null : { byline },
          spaceId: SPACE_ID,
        }),
      };
    }

    it("defaults to a hidden author and a visible updated date", async () => {
      const { service, pageRepo } = makeService({
        publicSpaceRepo: makeRepoWithByline(null),
      });

      const result = await service.getPublicPage(
        "handbook",
        "abc123XYZ0",
        makeWorkspace(optInSettings)
      );

      expect(result.byline).toEqual({ author: false, updatedAt: true });
      expect(pageRepo.findById).toHaveBeenCalledWith("abc123XYZ0", {
        includeContent: true,
        includeCreator: false,
      });
    });

    it("requests the creator only when the author byline is enabled", async () => {
      const { service, pageRepo } = makeService({
        publicSpaceRepo: makeRepoWithByline({ author: true }),
      });

      const result = await service.getPublicPage(
        "handbook",
        "abc123XYZ0",
        makeWorkspace(optInSettings)
      );

      expect(result.byline.author).toBe(true);
      expect(pageRepo.findById).toHaveBeenCalledWith("abc123XYZ0", {
        includeContent: true,
        includeCreator: true,
      });
    });

    it("strips a creator from the page when the author byline is off", async () => {
      const { service } = makeService({
        pageRepo: {
          findById: jest.fn().mockResolvedValue({
            content: null,
            creator: { avatarUrl: null, id: "u1", name: "Jane" },
            creatorId: "u1",
            deletedAt: null,
            id: "page1",
            slugId: "abc123XYZ0",
            spaceId: SPACE_ID,
            workspaceId: WORKSPACE_ID,
          }),
        },
        publicSpaceRepo: makeRepoWithByline({ author: false }),
      });

      const result = await service.getPublicPage(
        "handbook",
        "abc123XYZ0",
        makeWorkspace(optInSettings)
      );

      expect(result.page.creatorId).toBe("u1");
      expect((result.page as any).creator).toBeUndefined();
    });

    it("returns the byline for an empty published space", async () => {
      const { service } = makeService({
        pageRepo: {
          getFirstUnrestrictedRootPage: jest.fn().mockResolvedValue(undefined),
        },
        publicSpaceRepo: makeRepoWithByline({ author: true, updatedAt: false }),
      });

      const result = await service.getPublicPage(
        "handbook",
        undefined,
        makeWorkspace(optInSettings)
      );

      expect(result.page).toBeNull();
      expect(result.byline).toEqual({ author: true, updatedAt: false });
    });

    it("merges a single byline field into the stored byline", async () => {
      const { service, publicSpaceRepo } = makeService({
        publicSpaceRepo: makeRepoWithByline({ author: true, updatedAt: true }),
      });

      await service.publish({
        authUserId: "u1",
        bylineUpdatedAt: false,
        enabled: true,
        space: { id: SPACE_ID, workspaceId: WORKSPACE_ID } as any,
        workspace: makeWorkspace(optInSettings),
      });

      expect(publicSpaceRepo.upsert.mock.calls[0][0].settings).toEqual({
        byline: { author: true, updatedAt: false },
      });
    });

    it("leaves stored settings untouched when no byline field is sent", async () => {
      const { service, publicSpaceRepo } = makeService({
        publicSpaceRepo: makeRepoWithByline({ author: true }),
      });

      await service.publish({
        authUserId: "u1",
        enabled: true,
        space: { id: SPACE_ID, workspaceId: WORKSPACE_ID } as any,
        workspace: makeWorkspace(optInSettings),
      });

      expect(publicSpaceRepo.upsert.mock.calls[0][0].settings).toBeUndefined();
    });
  });

  describe("publish", () => {
    it("rejects enabling when the workspace opt-in is off", async () => {
      const { service } = makeService();
      await expect(
        service.publish({
          authUserId: "u1",
          enabled: true,
          space: { id: SPACE_ID, workspaceId: WORKSPACE_ID } as any,
          workspace: makeWorkspace({}),
        })
      ).rejects.toThrow(ForbiddenException);
    });

    it("allows enabling when public page sharing is disabled", async () => {
      const { service, publicSpaceRepo } = makeService();
      await service.publish({
        authUserId: "u1",
        enabled: true,
        space: { id: SPACE_ID, workspaceId: WORKSPACE_ID } as any,
        workspace: makeWorkspace({
          publicSpaces: { enabled: true },
          sharing: { disabled: true },
        }),
      });

      expect(publicSpaceRepo.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ enabled: true })
      );
    });

    it("allows disabling even when the opt-in is off", async () => {
      const { service, publicSpaceRepo } = makeService();
      await service.publish({
        authUserId: "u1",
        enabled: false,
        space: { id: SPACE_ID, workspaceId: WORKSPACE_ID } as any,
        workspace: makeWorkspace({}),
      });
      expect(publicSpaceRepo.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ enabled: false })
      );
    });

    it("defaults every option on except the author byline on first publish", async () => {
      const { service, publicSpaceRepo } = makeService({
        publicSpaceRepo: {
          findBySpaceId: jest.fn().mockResolvedValue(undefined),
        },
      });
      await service.publish({
        authUserId: "u1",
        enabled: true,
        space: { id: SPACE_ID, workspaceId: WORKSPACE_ID } as any,
        workspace: makeWorkspace({
          publicSpaces: { directory: true, enabled: true },
        }),
      });
      expect(publicSpaceRepo.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: true,
          searchIndexing: true,
          settings: { directory: true },
        })
      );
    });

    it("skips the directory default when the workspace directory is off", async () => {
      const { service, publicSpaceRepo } = makeService({
        publicSpaceRepo: {
          findBySpaceId: jest.fn().mockResolvedValue(undefined),
        },
      });
      await service.publish({
        authUserId: "u1",
        enabled: true,
        space: { id: SPACE_ID, workspaceId: WORKSPACE_ID } as any,
        workspace: makeWorkspace(optInSettings),
      });
      expect(publicSpaceRepo.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          searchIndexing: true,
          settings: undefined,
        })
      );
    });

    it("keeps explicitly provided flags on first publish", async () => {
      const { service, publicSpaceRepo } = makeService({
        publicSpaceRepo: {
          findBySpaceId: jest.fn().mockResolvedValue(undefined),
        },
      });
      await service.publish({
        authUserId: "u1",
        enabled: true,
        searchIndexing: false,
        space: { id: SPACE_ID, workspaceId: WORKSPACE_ID } as any,
        workspace: makeWorkspace({
          publicSpaces: { directory: true, enabled: true },
        }),
      });
      expect(publicSpaceRepo.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          searchIndexing: false,
          settings: { directory: true },
        })
      );
    });

    it("republish preserves prior customization instead of re-applying defaults", async () => {
      const { service, publicSpaceRepo } = makeService({
        publicSpaceRepo: {
          findBySpaceId: jest.fn().mockResolvedValue({
            enabled: false,
            id: "ps1",
            searchIndexing: false,
            settings: { directory: false },
            spaceId: SPACE_ID,
          }),
        },
      });
      await service.publish({
        authUserId: "u1",
        enabled: true,
        space: { id: SPACE_ID, workspaceId: WORKSPACE_ID } as any,
        workspace: makeWorkspace(optInSettings),
      });
      expect(publicSpaceRepo.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          searchIndexing: undefined,
          settings: undefined,
        })
      );
    });
  });

  describe("directory", () => {
    const directorySettings = {
      publicSpaces: { directory: true, enabled: true },
    };

    function makeDirectoryRows() {
      return [
        {
          description: "All about us",
          logo: null,
          name: "Handbook",
          searchIndexing: false,
          settings: { directory: true },
          slug: "handbook",
        },
        {
          description: null,
          logo: null,
          name: "Hidden",
          searchIndexing: true,
          settings: {},
          slug: "hidden",
        },
      ];
    }

    it("404s when the workspace opt-in is off", async () => {
      const { service } = makeService();
      await expect(
        service.getPublicSpaceDirectory(
          makeWorkspace({ publicSpaces: { directory: true, enabled: false } })
        )
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("404s when the directory flag is off", async () => {
      const { service } = makeService();
      await expect(
        service.getPublicSpaceDirectory(makeWorkspace(optInSettings))
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("lists only spaces opted into the directory with whitelisted fields", async () => {
      const { service } = makeService({
        publicSpaceRepo: {
          findEnabledWithSpaceByWorkspaceId: jest
            .fn()
            .mockResolvedValue(makeDirectoryRows()),
        },
      });
      const result = await service.getPublicSpaceDirectory(
        makeWorkspace(directorySettings)
      );
      expect(result.spaces).toEqual([
        {
          description: "All about us",
          logo: null,
          name: "Handbook",
          slug: "handbook",
        },
      ]);
    });

    it("publish stores the directory flag while preserving other settings", async () => {
      const { service, publicSpaceRepo } = makeService({
        publicSpaceRepo: {
          findBySpaceId: jest.fn().mockResolvedValue({
            enabled: true,
            id: "ps1",
            settings: { appearance: { primaryColorLight: "#111111" } },
            spaceId: SPACE_ID,
          }),
        },
      });
      await service.publish({
        authUserId: "u1",
        directory: true,
        enabled: true,
        space: { id: SPACE_ID, workspaceId: WORKSPACE_ID } as any,
        workspace: makeWorkspace(optInSettings),
      });
      expect(publicSpaceRepo.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: {
            appearance: { primaryColorLight: "#111111" },
            directory: true,
          },
        })
      );
    });

    it("publish leaves settings untouched when directory is omitted", async () => {
      const { service, publicSpaceRepo } = makeService();
      await service.publish({
        authUserId: "u1",
        enabled: true,
        space: { id: SPACE_ID, workspaceId: WORKSPACE_ID } as any,
        workspace: makeWorkspace(optInSettings),
      });
      expect(publicSpaceRepo.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ settings: undefined })
      );
    });
  });

  describe("cross-space link resolution", () => {
    const OTHER_SPACE_ID = "018f0000-0000-7000-8000-000000000004";

    const crossSpacePage = {
      content: null,
      deletedAt: null,
      id: "page2",
      slugId: "crossSlug001",
      spaceId: OTHER_SPACE_ID,
      workspaceId: WORKSPACE_ID,
    };

    const otherSpace = {
      deletedAt: null,
      id: OTHER_SPACE_ID,
      name: "Engineering",
      slug: "engineering",
      workspaceId: WORKSPACE_ID,
    };

    it("resolves a contentless probe into another published space", async () => {
      const { service } = makeService({
        pageRepo: { findById: jest.fn().mockResolvedValue(crossSpacePage) },
        spaceRepo: { findById: jest.fn().mockResolvedValue(otherSpace) },
      });
      const result = await service.getPublicPage(
        "handbook",
        "crossSlug001",
        makeWorkspace(optInSettings),
        { includeContent: false }
      );
      expect(result.space.slug).toBe("engineering");
      expect(result.page.id).toBe("page2");
    });

    it("404s a cross-space target when content is requested", async () => {
      const { service } = makeService({
        pageRepo: { findById: jest.fn().mockResolvedValue(crossSpacePage) },
        spaceRepo: { findById: jest.fn().mockResolvedValue(otherSpace) },
      });
      await expect(
        service.getPublicPage(
          "handbook",
          "crossSlug001",
          makeWorkspace(optInSettings)
        )
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("404s when the target space is not published", async () => {
      const { service } = makeService({
        pageRepo: { findById: jest.fn().mockResolvedValue(crossSpacePage) },
        publicSpaceRepo: {
          findBySpaceId: jest
            .fn()
            .mockImplementation(async (spaceId: string) =>
              spaceId === SPACE_ID
                ? { enabled: true, id: "ps1", spaceId: SPACE_ID }
                : { enabled: false, id: "ps2", spaceId }
            ),
        },
        spaceRepo: { findById: jest.fn().mockResolvedValue(otherSpace) },
      });
      await expect(
        service.getPublicPage(
          "handbook",
          "crossSlug001",
          makeWorkspace(optInSettings),
          { includeContent: false }
        )
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("404s when the target space is outside the workspace", async () => {
      const { service } = makeService({
        pageRepo: { findById: jest.fn().mockResolvedValue(crossSpacePage) },
        spaceRepo: { findById: jest.fn().mockResolvedValue(undefined) },
      });
      await expect(
        service.getPublicPage(
          "handbook",
          "crossSlug001",
          makeWorkspace(optInSettings),
          { includeContent: false }
        )
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("404s when the cross-space target has a restricted ancestor", async () => {
      const { service } = makeService({
        pagePermissionRepo: {
          hasRestrictedAncestor: jest.fn().mockResolvedValue(true),
        },
        pageRepo: { findById: jest.fn().mockResolvedValue(crossSpacePage) },
        spaceRepo: { findById: jest.fn().mockResolvedValue(otherSpace) },
      });
      await expect(
        service.getPublicPage(
          "handbook",
          "crossSlug001",
          makeWorkspace(optInSettings),
          { includeContent: false }
        )
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
