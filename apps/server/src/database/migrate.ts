import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as dotenv from "dotenv";
import { FileMigrationProvider, Kysely, Migrator } from "kysely";
import { run } from "kysely-migration-cli";
import { PostgresJSDialect } from "kysely-postgres-js";
import postgres from "postgres";
import { envPath, normalizePostgresUrl } from "../common/helpers";

dotenv.config({ path: envPath });

const migrationFolder = path.join(import.meta.dirname, "./migrations");

const db = new Kysely<any>({
  dialect: new PostgresJSDialect({
    postgres: postgres(normalizePostgresUrl(process.env.DATABASE_URL)),
  }),
});

const migrator = new Migrator({
  db,
  provider: new FileMigrationProvider({
    fs,
    migrationFolder,
    path,
  }),
});

run(db, migrator, migrationFolder);
