import { executeWithCursorPagination } from "@docmost/db/pagination/cursor-pagination";
import { DB, Users } from "@docmost/db/types/db";
import {
  InsertableUser,
  UpdatableUser,
  User,
} from "@docmost/db/types/entity.types";
import { KyselyDB, KyselyTransaction } from "@docmost/db/types/kysely.types";
import { dbOrTx } from "@docmost/db/utils";
import { Injectable } from "@nestjs/common";
import { ExpressionBuilder, sql } from "kysely";
import { jsonObjectFrom } from "kysely/helpers/postgres";
import { InjectKysely } from "nestjs-kysely";
import { hashPassword } from "../../../common/helpers";
import { NotificationSettingKey } from "../../../core/notification/notification.constants";
import { PaginationOptions } from "../../pagination/pagination-options";

@Injectable()
export class UserRepo {
  constructor(@InjectKysely() private readonly db: KyselyDB) {}

  public baseFields: Array<keyof Users> = [
    "id",
    "email",
    "name",
    "emailVerifiedAt",
    "avatarUrl",
    "role",
    "workspaceId",
    "locale",
    "timezone",
    "settings",
    "lastLoginAt",
    "deactivatedAt",
    "createdAt",
    "updatedAt",
    "deletedAt",
    "hasGeneratedPassword",
  ];

  async findById(
    userId: string,
    workspaceId: string,
    opts?: {
      includePassword?: boolean;
      includeUserMfa?: boolean;
      includeScimExternalId?: boolean;
      trx?: KyselyTransaction;
    }
  ): Promise<User> {
    const db = dbOrTx(this.db, opts?.trx);
    return db
      .selectFrom("users")
      .select(this.baseFields)
      .$if(opts?.includePassword, (qb) => qb.select("password"))
      .$if(opts?.includeUserMfa, (qb) => qb.select(this.withUserMfa))
      .$if(opts?.includeScimExternalId, (qb) => qb.select("scimExternalId"))
      .where("id", "=", userId)
      .where("workspaceId", "=", workspaceId)
      .executeTakeFirst();
  }

  async findByEmail(
    email: string,
    workspaceId: string,
    opts?: {
      includePassword?: boolean;
      includeUserMfa?: boolean;
      includeScimExternalId?: boolean;
      trx?: KyselyTransaction;
    }
  ): Promise<User> {
    const db = dbOrTx(this.db, opts?.trx);
    return db
      .selectFrom("users")
      .select(this.baseFields)
      .$if(opts?.includePassword, (qb) => qb.select("password"))
      .$if(opts?.includeUserMfa, (qb) => qb.select(this.withUserMfa))
      .$if(opts?.includeScimExternalId, (qb) => qb.select("scimExternalId"))
      .where(sql`LOWER(email)`, "=", sql`LOWER(${email})`)
      .where("workspaceId", "=", workspaceId)
      .executeTakeFirst();
  }

  async updateUser(
    updatableUser: UpdatableUser,
    userId: string,
    workspaceId: string,
    trx?: KyselyTransaction
  ) {
    const db = dbOrTx(this.db, trx);

    return await db
      .updateTable("users")
      .set({ ...updatableUser, updatedAt: new Date() })
      .where("id", "=", userId)
      .where("workspaceId", "=", workspaceId)
      .execute();
  }

  async updateLastLogin(userId: string, workspaceId: string) {
    return await this.db
      .updateTable("users")
      .set({
        lastLoginAt: new Date(),
      })
      .where("id", "=", userId)
      .where("workspaceId", "=", workspaceId)
      .execute();
  }

  async insertUser(
    insertableUser: InsertableUser,
    trx?: KyselyTransaction,
    opts?: { pageEditMode?: string }
  ): Promise<User> {
    const user: InsertableUser = {
      email: insertableUser.email.toLowerCase(),
      lastLoginAt: new Date(),
      locale: "en-US",
      name:
        insertableUser.name || insertableUser.email.split("@")[0].toLowerCase(),
      password: await hashPassword(insertableUser.password),
      role: insertableUser?.role,
    };

    const db = dbOrTx(this.db, trx);
    return db
      .insertInto("users")
      .values({
        ...insertableUser,
        ...user,
        ...(opts?.pageEditMode
          ? {
              settings: sql`${JSON.stringify({
                preferences: { pageEditMode: opts.pageEditMode },
              })}::text::jsonb`,
            }
          : {}),
      })
      .returning(this.baseFields)
      .executeTakeFirst();
  }

  async roleCountByWorkspaceId(
    role: string,
    workspaceId: string,
    trx?: KyselyTransaction
  ): Promise<number> {
    const db = dbOrTx(this.db, trx);
    const { count } = await db
      .selectFrom("users")
      .select((eb) => eb.fn.count("role").as("count"))
      .where("role", "=", role)
      .where("workspaceId", "=", workspaceId)
      .where("deletedAt", "is", null)
      .where("deactivatedAt", "is", null)
      .executeTakeFirst();

    return count as number;
  }

  async getUsersPaginated(workspaceId: string, pagination: PaginationOptions) {
    let query = this.db
      .selectFrom("users")
      .select(this.baseFields)
      .where("workspaceId", "=", workspaceId)
      .where("deletedAt", "is", null);

    if (pagination.query) {
      query = query.where((eb) =>
        eb(
          sql`f_unaccent(users.name)`,
          "ilike",
          sql`f_unaccent(${"%" + pagination.query + "%"})`
        ).or(
          sql`users.email`,
          "ilike",
          sql`f_unaccent(${"%" + pagination.query + "%"})`
        )
      );
    }

    return executeWithCursorPagination(query, {
      beforeCursor: pagination.beforeCursor,
      cursor: pagination.cursor,
      fields: [
        { direction: "asc", expression: "name" },
        { direction: "asc", expression: "id" },
      ],
      parseCursor: (cursor) => ({ id: cursor.id, name: cursor.name }),
      perPage: pagination.limit,
    });
  }

  async updatePreference(
    userId: string,
    prefKey: string,
    prefValue: string | boolean
  ) {
    return await this.db
      .updateTable("users")
      .set({
        settings: sql`COALESCE(settings, '{}'::jsonb)
                || jsonb_build_object('preferences', COALESCE(settings->'preferences', '{}'::jsonb) 
                || jsonb_build_object('${sql.raw(prefKey)}', ${sql.lit(prefValue)}))`,
        updatedAt: new Date(),
      })
      .where("id", "=", userId)
      .returning(this.baseFields)
      .executeTakeFirst();
  }

  async updateNotificationSetting(
    userId: string,
    settingKey: NotificationSettingKey,
    settingValue: boolean
  ) {
    return await this.db
      .updateTable("users")
      .set({
        settings: sql`COALESCE(settings, '{}'::jsonb)
                || jsonb_build_object('notifications', COALESCE(settings->'notifications', '{}'::jsonb)
                || jsonb_build_object(${sql.lit(settingKey)}, ${sql.lit(settingValue)}))`,
        updatedAt: new Date(),
      })
      .where("id", "=", userId)
      .returning(this.baseFields)
      .executeTakeFirst();
  }

  withUserMfa(eb: ExpressionBuilder<DB, "users">) {
    return jsonObjectFrom(
      eb
        .selectFrom("userMfa")
        .select([
          "userMfa.id",
          "userMfa.method",
          "userMfa.isEnabled",
          "userMfa.createdAt",
        ])
        .whereRef("userMfa.userId", "=", "users.id")
    ).as("mfa");
  }
}
