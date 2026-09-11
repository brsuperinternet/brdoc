import { executeWithCursorPagination } from "@docmost/db/pagination/cursor-pagination";
import { PaginationOptions } from "@docmost/db/pagination/pagination-options";
import { DB } from "@docmost/db/types/db";
import {
  InsertablePageHistory,
  Page,
  PageHistory,
} from "@docmost/db/types/entity.types";
import { Injectable } from "@nestjs/common";
import { ExpressionBuilder, sql } from "kysely";
import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres";
import { InjectKysely } from "nestjs-kysely";
import { KyselyDB, KyselyTransaction } from "../../types/kysely.types";
import { dbOrTx } from "../../utils";

@Injectable()
export class PageHistoryRepo {
  constructor(@InjectKysely() private readonly db: KyselyDB) {}

  private baseFields: Array<keyof PageHistory> = [
    "id",
    "pageId",
    "slugId",
    "title",
    "icon",
    "coverPhoto",
    "lastUpdatedById",
    "contributorIds",
    "spaceId",
    "workspaceId",
    "createdAt",
  ];

  async findById(
    pageHistoryId: string,
    opts?: {
      includeContent?: boolean;
      trx?: KyselyTransaction;
    }
  ): Promise<PageHistory> {
    const db = dbOrTx(this.db, opts?.trx);

    return await db
      .selectFrom("pageHistory")
      .select(this.baseFields)
      .$if(opts?.includeContent, (qb) => qb.select("content"))
      .select((eb) => this.withLastUpdatedBy(eb))
      .select((eb) => this.withContributors(eb))
      .where("id", "=", pageHistoryId)
      .executeTakeFirst();
  }

  async insertPageHistory(
    insertablePageHistory: InsertablePageHistory,
    trx?: KyselyTransaction
  ): Promise<PageHistory> {
    const db = dbOrTx(this.db, trx);
    return db
      .insertInto("pageHistory")
      .values(insertablePageHistory)
      .returningAll()
      .executeTakeFirst();
  }

  async saveHistory(
    page: Page,
    opts?: { contributorIds?: string[]; trx?: KyselyTransaction }
  ): Promise<void> {
    await this.insertPageHistory(
      {
        content: page.content,
        contributorIds: opts?.contributorIds,
        coverPhoto: page.coverPhoto,
        icon: page.icon,
        lastUpdatedById: page.lastUpdatedById ?? page.creatorId,
        pageId: page.id,
        slugId: page.slugId,
        spaceId: page.spaceId,
        title: page.title,
        workspaceId: page.workspaceId,
      },
      opts?.trx
    );
  }

  async findPageHistoryByPageId(pageId: string, pagination: PaginationOptions) {
    const query = this.db
      .selectFrom("pageHistory")
      .select(this.baseFields)
      .select((eb) => this.withLastUpdatedBy(eb))
      .select((eb) => this.withContributors(eb))
      .where("pageId", "=", pageId);

    return executeWithCursorPagination(query, {
      beforeCursor: pagination.beforeCursor,
      cursor: pagination.cursor,
      fields: [{ direction: "desc", expression: "id" }],
      parseCursor: (cursor) => ({ id: cursor.id }),
      perPage: pagination.limit,
    });
  }

  async findPageLastHistory(
    pageId: string,
    opts?: {
      includeContent?: boolean;
      trx?: KyselyTransaction;
    }
  ) {
    const db = dbOrTx(this.db, opts?.trx);

    return await db
      .selectFrom("pageHistory")
      .select(this.baseFields)
      .$if(opts?.includeContent, (qb) => qb.select("content"))
      .where("pageId", "=", pageId)
      .limit(1)
      .orderBy("createdAt", "desc")
      .executeTakeFirst();
  }

  withLastUpdatedBy(eb: ExpressionBuilder<DB, "pageHistory">) {
    return jsonObjectFrom(
      eb
        .selectFrom("users")
        .select(["users.id", "users.name", "users.avatarUrl"])
        .whereRef("users.id", "=", "pageHistory.lastUpdatedById")
    ).as("lastUpdatedBy");
  }

  withContributors(eb: ExpressionBuilder<DB, "pageHistory">) {
    return jsonArrayFrom(
      eb
        .selectFrom("users")
        .select(["users.id", "users.name", "users.avatarUrl"])
        .whereRef(
          "users.id",
          "=",
          sql`ANY(${eb.ref("pageHistory.contributorIds")})`
        )
    ).as("contributors");
  }
}
