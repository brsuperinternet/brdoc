import { executeWithCursorPagination } from "@docmost/db/pagination/cursor-pagination";
import { PaginationOptions } from "@docmost/db/pagination/pagination-options";
import { DB, Json } from "@docmost/db/types/db";
import { PublicSpace } from "@docmost/db/types/entity.types";
import { Injectable } from "@nestjs/common";
import { ExpressionBuilder, sql } from "kysely";
import { jsonObjectFrom } from "kysely/helpers/postgres";
import { InjectKysely } from "nestjs-kysely";
import { KyselyDB, KyselyTransaction } from "../../types/kysely.types";
import { dbOrTx } from "../../utils";

@Injectable()
export class PublicSpaceRepo {
  constructor(@InjectKysely() private readonly db: KyselyDB) {}

  async findBySpaceId(
    spaceId: string,
    trx?: KyselyTransaction
  ): Promise<PublicSpace> {
    const db = dbOrTx(this.db, trx);
    return db
      .selectFrom("publicSpaces")
      .selectAll()
      .where("spaceId", "=", spaceId)
      .executeTakeFirst();
  }

  async upsert(opts: {
    spaceId: string;
    workspaceId: string;
    enabled: boolean;
    searchIndexing?: boolean;
    creatorId: string;
    settings?: Record<string, unknown>;
  }): Promise<PublicSpace> {
    const settingsColumn =
      typeof opts.settings === "undefined"
        ? {}
        : {
            settings: sql<Json>`${JSON.stringify(opts.settings)}::text::jsonb`,
          };

    return this.db
      .insertInto("publicSpaces")
      .values({
        creatorId: opts.creatorId,
        enabled: opts.enabled,
        searchIndexing: opts.searchIndexing ?? false,
        spaceId: opts.spaceId,
        workspaceId: opts.workspaceId,
        ...settingsColumn,
      })
      .onConflict((oc) =>
        oc.column("spaceId").doUpdateSet({
          enabled: opts.enabled,
          updatedAt: new Date(),
          ...(typeof opts.searchIndexing === "undefined"
            ? {}
            : { searchIndexing: opts.searchIndexing }),
          ...settingsColumn,
        })
      )
      .returningAll()
      .executeTakeFirst();
  }

  // Published spaces are public by definition, so the list spans the whole
  // workspace; userId only resolves the viewer's per-space role.
  async getPublishedSpaces(
    userId: string,
    workspaceId: string,
    pagination: PaginationOptions
  ) {
    const query = this.db
      .selectFrom("publicSpaces")
      .select([
        "id",
        "spaceId",
        "workspaceId",
        "searchIndexing",
        "settings",
        "createdAt",
        "updatedAt",
      ])
      .select((eb) => this.withSpace(eb, userId))
      .select((eb) => this.withCreator(eb))
      .where("workspaceId", "=", workspaceId)
      .where("enabled", "=", true)
      .where(({ exists, selectFrom }) =>
        exists(
          selectFrom("spaces")
            .select("spaces.id")
            .whereRef("spaces.id", "=", "publicSpaces.spaceId")
            .where("spaces.deletedAt", "is", null)
        )
      );

    return executeWithCursorPagination(query, {
      beforeCursor: pagination.beforeCursor,
      cursor: pagination.cursor,
      fields: [
        { direction: "desc", expression: "updatedAt" },
        { direction: "desc", expression: "id" },
      ],
      parseCursor: (cursor) => ({
        id: cursor.id,
        updatedAt: new Date(cursor.updatedAt),
      }),
      perPage: pagination.limit,
    });
  }

  withSpace(eb: ExpressionBuilder<DB, "publicSpaces">, userId: string) {
    return jsonObjectFrom(
      eb
        .selectFrom("spaces")
        .select(["spaces.id", "spaces.name", "spaces.slug", "spaces.logo"])
        .select((eb) => this.withUserSpaceRole(eb, userId))
        .whereRef("spaces.id", "=", "publicSpaces.spaceId")
    ).as("space");
  }

  withUserSpaceRole(eb: ExpressionBuilder<DB, "spaces">, userId: string) {
    return eb
      .selectFrom(
        eb
          .selectFrom("spaceMembers")
          .select(["spaceMembers.role"])
          .whereRef("spaceMembers.spaceId", "=", "spaces.id")
          .where("spaceMembers.userId", "=", userId)
          .unionAll(
            eb
              .selectFrom("spaceMembers")
              .innerJoin(
                "groupUsers",
                "groupUsers.groupId",
                "spaceMembers.groupId"
              )
              .select(["spaceMembers.role"])
              .whereRef("spaceMembers.spaceId", "=", "spaces.id")
              .where("groupUsers.userId", "=", userId)
          )
          .as("roles_union")
      )
      .select("roles_union.role")
      .orderBy(
        sql`CASE roles_union.role
            WHEN 'admin' THEN 3
            WHEN 'writer' THEN 2
            WHEN 'reader' THEN 1
            ELSE 0
           END`,
        "desc"
      )
      .limit(1)
      .as("userRole");
  }

  withCreator(eb: ExpressionBuilder<DB, "publicSpaces">) {
    return jsonObjectFrom(
      eb
        .selectFrom("users")
        .select(["users.id", "users.name", "users.avatarUrl"])
        .whereRef("users.id", "=", "publicSpaces.creatorId")
    ).as("creator");
  }

  async findEnabledWithSpaceByWorkspaceId(workspaceId: string) {
    return this.db
      .selectFrom("publicSpaces")
      .innerJoin("spaces", "spaces.id", "publicSpaces.spaceId")
      .select([
        "publicSpaces.settings",
        "publicSpaces.searchIndexing",
        "spaces.name",
        "spaces.slug",
        "spaces.description",
        "spaces.logo",
      ])
      .where("publicSpaces.workspaceId", "=", workspaceId)
      .where("publicSpaces.enabled", "=", true)
      .where("spaces.deletedAt", "is", null)
      .orderBy("spaces.name", "asc")
      .execute();
  }

  async disableByWorkspaceId(
    workspaceId: string,
    trx?: KyselyTransaction
  ): Promise<void> {
    const db = dbOrTx(this.db, trx);
    await db
      .updateTable("publicSpaces")
      .set({ enabled: false, updatedAt: new Date() })
      .where("workspaceId", "=", workspaceId)
      .execute();
  }
}
