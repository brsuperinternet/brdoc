import { Injectable, NestMiddleware } from "@nestjs/common";
import { FastifyReply, FastifyRequest } from "fastify";
import { ClsService } from "nestjs-cls";

export interface AuditContext {
  actorId: string | null;
  actorType: "user" | "system" | "api_key";
  ipAddress: string | null;
  userAgent: string | null;
  workspaceId: string | null;
}

export const AUDIT_CONTEXT_KEY = "auditContext";

@Injectable()
export class AuditContextMiddleware implements NestMiddleware {
  constructor(private readonly cls: ClsService) {}

  use(req: FastifyRequest["raw"], res: FastifyReply["raw"], next: () => void) {
    const workspaceId = (req as any).workspaceId ?? null;

    const ipAddress =
      (req as any).ip ?? (req as any).socket?.remoteAddress ?? null;

    const userAgent = (req.headers["user-agent"] as string) ?? null;

    const auditContext: AuditContext = {
      actorId: null,
      actorType: "user",
      ipAddress,
      userAgent,
      workspaceId,
    };

    this.cls.set(AUDIT_CONTEXT_KEY, auditContext);

    next();
  }
}
