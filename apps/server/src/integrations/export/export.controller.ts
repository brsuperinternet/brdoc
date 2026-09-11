import * as path from "node:path";
import { PageRepo } from "@docmost/db/repos/page/page.repo";
import { User } from "@docmost/db/types/entity.types";
import {
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Post,
  Res,
  UseGuards,
} from "@nestjs/common";
import { FastifyReply } from "fastify";
import { AuthUser } from "../../common/decorators/auth-user.decorator";
import { AuditEvent, AuditResource } from "../../common/events/audit-events";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import {
  getMimeType,
  getPageTitle,
  sanitizeFileName,
} from "../../common/helpers";
import SpaceAbilityFactory from "../../core/casl/abilities/space-ability.factory";
import {
  SpaceCaslAction,
  SpaceCaslSubject,
} from "../../core/casl/interfaces/space-ability.type";
import { PageAccessService } from "../../core/page/page-access/page-access.service";
import {
  AUDIT_SERVICE,
  IAuditService,
} from "../../integrations/audit/audit.service";
import { ExportPageDto, ExportSpaceDto } from "./dto/export-dto";
import { ExportService } from "./export.service";
import { getExportExtension } from "./utils";

@Controller()
export class ExportController {
  constructor(
    private readonly exportService: ExportService,
    private readonly pageRepo: PageRepo,
    private readonly spaceAbility: SpaceAbilityFactory,
    private readonly pageAccessService: PageAccessService,
    @Inject(AUDIT_SERVICE) private readonly auditService: IAuditService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post("pages/export")
  async exportPage(
    @Body() dto: ExportPageDto,
    @AuthUser() user: User,
    @Res() res: FastifyReply
  ) {
    const page = await this.pageRepo.findById(dto.pageId, {
      includeContent: true,
    });

    if (!page || page.deletedAt) {
      throw new NotFoundException("Page not found");
    }

    await this.pageAccessService.validateCanView(page, user);

    const result = await this.exportService.exportPages(
      dto.pageId,
      dto.format,
      dto.includeAttachments,
      dto.includeChildren,
      user.id
    );

    this.auditService.log({
      event: AuditEvent.PAGE_EXPORTED,
      metadata: {
        format: dto.format,
        includeAttachments: dto.includeAttachments,
        includeChildren: dto.includeChildren,
        spaceId: page.spaceId,
        title: getPageTitle(page.title),
      },
      resourceId: page.id,
      resourceType: AuditResource.PAGE,
      spaceId: page.spaceId,
    });

    if (result.type === "file") {
      const ext = getExportExtension(dto.format);
      const fileName =
        sanitizeFileName(page.title || "untitled", { preserveSpaces: true }) +
        ext;
      const contentType = getMimeType(path.extname(fileName));

      res.headers({
        "Content-Disposition":
          'attachment; filename="' + encodeURIComponent(fileName) + '"',
        "Content-Type": contentType,
      });

      res.send(result.content);
    } else {
      const fileName =
        sanitizeFileName(page.title || "untitled", { preserveSpaces: true }) +
        ".zip";

      res.headers({
        "Content-Disposition":
          'attachment; filename="' + encodeURIComponent(fileName) + '"',
        "Content-Type": "application/zip",
      });

      res.send(result.stream);
    }
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post("spaces/export")
  async exportSpace(
    @Body() dto: ExportSpaceDto,
    @AuthUser() user: User,
    @Res() res: FastifyReply
  ) {
    const ability = await this.spaceAbility.createForUser(user, dto.spaceId);
    if (ability.cannot(SpaceCaslAction.Manage, SpaceCaslSubject.Settings)) {
      throw new ForbiddenException();
    }

    const exportFile = await this.exportService.exportSpace(
      dto.spaceId,
      dto.format,
      dto.includeAttachments,
      user.id
    );

    this.auditService.log({
      event: AuditEvent.SPACE_EXPORTED,
      metadata: {
        format: dto.format,
        includeAttachments: dto.includeAttachments ?? false,
        spaceName: exportFile.spaceName,
      },
      resourceId: dto.spaceId,
      resourceType: AuditResource.SPACE,
      spaceId: dto.spaceId,
    });

    res.headers({
      "Content-Disposition":
        'attachment; filename="' +
        encodeURIComponent(
          sanitizeFileName(exportFile.fileName, { preserveSpaces: true })
        ) +
        '"',
      "Content-Type": "application/zip",
    });

    res.send(exportFile.fileStream);
  }
}
