import { Page } from "@docmost/db/types/entity.types";
import { Injectable } from "@nestjs/common";
import { WsService } from "./ws.service";

@Injectable()
export class WsTreeService {
  constructor(private readonly wsService: WsService) {}

  async notifyPageRestricted(page: Page, excludeUserId: string): Promise<void> {
    await this.wsService.emitToSpaceExceptUsers(page.spaceId, [excludeUserId], {
      operation: "deleteTreeNode",
      payload: {
        node: {
          id: page.id,
          slugId: page.slugId,
        },
      },
      spaceId: page.spaceId,
    });
  }

  async notifyPermissionGranted(page: Page, userIds: string[]): Promise<void> {
    if (userIds.length === 0) {
      return;
    }

    await this.wsService.emitToUsers(userIds, {
      operation: "addTreeNode",
      payload: {
        data: {
          children: [],
          creatorId: page.creatorId,
          hasChildren: false,
          icon: page.icon,
          id: page.id,
          name: page.title ?? "",
          parentPageId: page.parentPageId,
          position: page.position,
          slugId: page.slugId,
          spaceId: page.spaceId,
          title: page.title,
        },
        index: 0,
        parentId: page.parentPageId ?? null,
      },
      spaceId: page.spaceId,
    });
  }
}
