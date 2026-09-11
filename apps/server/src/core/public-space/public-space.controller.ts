import { PaginationOptions } from "@docmost/db/pagination/pagination-options";
import { PublicSpaceRepo } from "@docmost/db/repos/public-space/public-space.repo";
import { SpaceRepo } from "@docmost/db/repos/space/space.repo";
import { User, Workspace } from "@docmost/db/types/entity.types";
import {
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Post,
  UseGuards,
} from "@nestjs/common";
import { AuthUser } from "../../common/decorators/auth-user.decorator";
import { AuthWorkspace } from "../../common/decorators/auth-workspace.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { AuditEvent, AuditResource } from "../../common/events/audit-events";
import { Feature, FeatureKey } from "../../common/features";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import {
  AUDIT_SERVICE,
  IAuditService,
} from "../../integrations/audit/audit.service";
import { EnvironmentService } from "../../integrations/environment/environment.service";
import { LicenseCheckService } from "../../integrations/environment/license-check.service";
import SpaceAbilityFactory from "../casl/abilities/space-ability.factory";
import {
  SpaceCaslAction,
  SpaceCaslSubject,
} from "../casl/interfaces/space-ability.type";
import {
  PublicSpaceForSpaceDto,
  PublicSpacePageDto,
  PublicSpaceSlugDto,
  PublicSpaceTransclusionLookupDto,
  PublishSpaceDto,
} from "./dto/public-space.dto";
import { PublicSpaceService } from "./public-space.service";

const PUBLIC_SPACE_FEATURES: FeatureKey[] = [Feature.PUBLIC_SPACE_APPEARANCE];

@UseGuards(JwtAuthGuard)
@Controller("public-spaces")
export class PublicSpaceController {
  constructor(
    private readonly publicSpaceService: PublicSpaceService,
    private readonly publicSpaceRepo: PublicSpaceRepo,
    private readonly spaceRepo: SpaceRepo,
    private readonly spaceAbility: SpaceAbilityFactory,
    private readonly licenseCheckService: LicenseCheckService,
    private readonly environmentService: EnvironmentService,
    @Inject(AUDIT_SERVICE) private readonly auditService: IAuditService,
  ) {}

  private assertBetaPublicSpaces() {
    if (!this.environmentService.isBetaPublicSpaces()) {
      throw new ForbiddenException(
        "Public spaces are not enabled on this instance"
      );
    }
  }

  @HttpCode(HttpStatus.OK)
  @Post("/")
  async getPublishedSpaces(
    @Body() pagination: PaginationOptions,
    @AuthUser() user: User,
    @AuthWorkspace() workspace: Workspace
  ) {
    this.assertBetaPublicSpaces();
    return this.publicSpaceRepo.getPublishedSpaces(
      user.id,
      workspace.id,
      pagination
    );
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("/info")
  async getInfo(
    @Body() dto: PublicSpaceSlugDto,
    @AuthWorkspace() workspace: Workspace
  ) {
    const info = await this.publicSpaceService.getPublicSpaceInfo(
      dto.spaceSlug,
      workspace
    );
    return {
      ...info,
      features: this.publicFeatures(workspace),
    };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('/directory')
  async getDirectory(@AuthWorkspace() workspace: Workspace) {
    const directory =
      await this.publicSpaceService.getPublicSpaceDirectory(workspace);
    return {
      ...directory,
      features: this.publicFeatures(workspace),
    };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("/tree")
  async getTree(
    @Body() dto: PublicSpaceSlugDto,
    @AuthWorkspace() workspace: Workspace
  ) {
    const treeData = await this.publicSpaceService.getPublicSpaceTree(
      dto.spaceSlug,
      workspace
    );
    return {
      ...treeData,
      features: this.publicFeatures(workspace),
    };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("/page-info")
  async getPageInfo(
    @Body() dto: PublicSpacePageDto,
    @AuthWorkspace() workspace: Workspace
  ) {
    const pageData = await this.publicSpaceService.getPublicPage(
      dto.spaceSlug,
      dto.pageSlugId,
      workspace,
      { includeContent: dto.contentless !== true }
    );
    return {
      ...pageData,
      features: this.publicFeatures(workspace),
    };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("/transclusion/lookup")
  async transclusionLookup(
    @Body() dto: PublicSpaceTransclusionLookupDto,
    @AuthWorkspace() workspace: Workspace
  ) {
    return this.publicSpaceService.lookupTransclusionForPublicSpace(
      dto.spaceSlug,
      dto.references,
      workspace
    );
  }

  private publicFeatures(workspace: Workspace): string[] {
    const features = this.licenseCheckService.resolveFeatures(
      workspace.licenseKey,
      workspace.plan
    );
    return PUBLIC_SPACE_FEATURES.filter((feature) =>
      features.includes(feature)
    );
  }

  @HttpCode(HttpStatus.OK)
  @Post("/for-space")
  async getForSpace(
    @Body() dto: PublicSpaceForSpaceDto,
    @AuthUser() user: User,
    @AuthWorkspace() workspace: Workspace
  ) {
    this.assertBetaPublicSpaces();
    const space = await this.spaceRepo.findById(dto.spaceId, workspace.id);
    if (!space || space.deletedAt) {
      throw new NotFoundException("Space not found");
    }

    const ability = await this.spaceAbility.createForUser(user, space.id);
    if (ability.cannot(SpaceCaslAction.Manage, SpaceCaslSubject.Settings)) {
      throw new ForbiddenException();
    }

    return (await this.publicSpaceRepo.findBySpaceId(space.id)) ?? null;
  }

  @HttpCode(HttpStatus.OK)
  @Post("/publish")
  async publish(
    @Body() dto: PublishSpaceDto,
    @AuthUser() user: User,
    @AuthWorkspace() workspace: Workspace
  ) {
    const space = await this.spaceRepo.findById(dto.spaceId, workspace.id);
    if (!space || space.deletedAt) {
      throw new NotFoundException("Space not found");
    }

    const ability = await this.spaceAbility.createForUser(user, space.id);
    if (ability.cannot(SpaceCaslAction.Manage, SpaceCaslSubject.Settings)) {
      throw new ForbiddenException();
    }

    const prev = await this.publicSpaceRepo.findBySpaceId(space.id);

    const publicSpace = await this.publicSpaceService.publish({
      appearance: dto.appearance,
      authUserId: user.id,
      bylineAuthor: dto.bylineAuthor,
      bylineUpdatedAt: dto.bylineUpdatedAt,
      directory: dto.directory,
      enabled: dto.enabled,
      searchIndexing: dto.searchIndexing,
      space,
      workspace,
    });

    const prevByline = (prev?.settings as any)?.byline;
    const nextSettings = publicSpace?.settings as any;

    this.auditService.log({
      changes: {
        after: {
          bylineAuthor: nextSettings?.byline?.author === true,
          bylineUpdatedAt: nextSettings?.byline?.updatedAt !== false,
          directory: nextSettings?.directory === true,
          isPublished: publicSpace?.enabled ?? dto.enabled,
          searchIndexing: publicSpace?.searchIndexing === true,
        },
        before: {
          bylineAuthor: prevByline?.author === true,
          bylineUpdatedAt: prevByline?.updatedAt !== false,
          directory: (prev?.settings as any)?.directory === true,
          isPublished: prev?.enabled ?? false,
          searchIndexing: prev?.searchIndexing === true,
        },
      },
      event: AuditEvent.SPACE_UPDATED,
      resourceId: space.id,
      resourceType: AuditResource.SPACE,
      spaceId: space.id,
    });

    return publicSpace;
  }
}
