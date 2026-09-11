import * as path from "node:path";
import { User, Workspace } from "@docmost/db/types/entity.types";
import {
  BadRequestException,
  Controller,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  Inject,
  Logger,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import * as bytes from "bytes";
import { AuthUser } from "../../common/decorators/auth-user.decorator";
import { AuthWorkspace } from "../../common/decorators/auth-workspace.decorator";
import { AuditEvent, AuditResource } from "../../common/events/audit-events";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { FileInterceptor } from "../../common/interceptors/file.interceptor";
import SpaceAbilityFactory from "../../core/casl/abilities/space-ability.factory";
import {
  SpaceCaslAction,
  SpaceCaslSubject,
} from "../../core/casl/interfaces/space-ability.type";
import {
  AUDIT_SERVICE,
  IAuditService,
} from "../../integrations/audit/audit.service";
import { EnvironmentService } from "../environment/environment.service";
import { ImportService } from "./services/import.service";

@Controller()
export class ImportController {
  private readonly logger = new Logger(ImportController.name);

  constructor(
    private readonly importService: ImportService,
    private readonly spaceAbility: SpaceAbilityFactory,
    private readonly environmentService: EnvironmentService,
    @Inject(AUDIT_SERVICE) private readonly auditService: IAuditService,
  ) {}

  @UseInterceptors(FileInterceptor)
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post("pages/import")
  async importPage(
    @Req() req: any,
    @AuthUser() user: User,
    @AuthWorkspace() workspace: Workspace
  ) {
    const validFileExtensions = [".md", ".html", ".docx", ".pdf"];

    const maxFileSize = bytes("30mb");

    let file = null;
    try {
      file = await req.file({
        limits: { fields: 4, fileSize: maxFileSize, files: 1 },
      });
    } catch (err: any) {
      this.logger.error(err.message);
      if (err?.statusCode === 413) {
        throw new BadRequestException(
          "File too large. Exceeds the 10mb import limit"
        );
      }
    }

    if (!file) {
      throw new BadRequestException("Failed to upload file");
    }

    if (
      !validFileExtensions.includes(path.extname(file.filename).toLowerCase())
    ) {
      throw new BadRequestException("Invalid import file type.");
    }

    const spaceId = file.fields?.spaceId?.value;

    if (!spaceId) {
      throw new BadRequestException("spaceId is required");
    }

    const ability = await this.spaceAbility.createForUser(user, spaceId);
    if (ability.cannot(SpaceCaslAction.Edit, SpaceCaslSubject.Page)) {
      throw new ForbiddenException();
    }

    const createdPage = await this.importService.importPage(
      file,
      user.id,
      spaceId,
      workspace.id
    );

    const ext = path.extname(file.filename).toLowerCase();
    const sourceMap: Record<string, string> = {
      ".docx": "docx",
      ".html": "html",
      ".md": "markdown",
      ".pdf": "pdf",
    };

    if (createdPage) {
      this.auditService.log({
        event: AuditEvent.PAGE_CREATED,
        metadata: {
          fileName: file.filename,
          source: sourceMap[ext],
        },
        resourceId: createdPage.id,
        resourceType: AuditResource.PAGE,
        spaceId,
      });
    }

    return createdPage;
  }

  @UseInterceptors(FileInterceptor)
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post("pages/import-zip")
  async importZip(
    @Req() req: any,
    @AuthUser() user: User,
    @AuthWorkspace() workspace: Workspace
  ) {
    const validFileExtensions = [".zip"];

    const maxFileSize = bytes(this.environmentService.getFileImportSizeLimit());

    let file = null;
    try {
      file = await req.file({
        limits: { fields: 3, fileSize: maxFileSize, files: 1 },
      });
    } catch (err: any) {
      this.logger.error(err.message);
      if (err?.statusCode === 413) {
        throw new BadRequestException(
          `File too large. Exceeds the ${this.environmentService.getFileImportSizeLimit()} import limit`
        );
      }
    }

    if (!file) {
      throw new BadRequestException("Failed to upload file");
    }

    if (
      !validFileExtensions.includes(path.extname(file.filename).toLowerCase())
    ) {
      throw new BadRequestException("Invalid import file extension.");
    }

    const spaceId = file.fields?.spaceId?.value;
    const source = file.fields?.source?.value;

    const validZipSources = ["generic", "notion", "confluence"];
    if (!validZipSources.includes(source)) {
      throw new BadRequestException(
        "Invalid import source. Import source must either be generic, notion or confluence."
      );
    }

    if (!spaceId) {
      throw new BadRequestException("spaceId is required");
    }

    const ability = await this.spaceAbility.createForUser(user, spaceId);
    if (ability.cannot(SpaceCaslAction.Edit, SpaceCaslSubject.Page)) {
      throw new ForbiddenException();
    }

    this.auditService.log({
      event: AuditEvent.PAGE_IMPORTED,
      metadata: {
        fileName: file.filename,
        source,
        spaceId,
      },
      resourceId: spaceId,
      resourceType: AuditResource.PAGE,
      spaceId,
    });

    return this.importService.importZip(
      file,
      source,
      user.id,
      spaceId,
      workspace.id
    );
  }
}
