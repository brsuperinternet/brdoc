import { promises as fs } from "node:fs";
import * as path from "node:path";
import { KyselyDB } from "@docmost/db/types/kysely.types";
import { Injectable, Logger } from "@nestjs/common";
import { FileMigrationProvider, Migrator } from "kysely";
import { InjectKysely } from "nestjs-kysely";

@Injectable()
export class MigrationService {
  private readonly logger = new Logger(`Database${MigrationService.name}`);

  constructor(@InjectKysely() private readonly db: KyselyDB) {}

  async migrateToLatest(): Promise<void> {
    const migrator = new Migrator({
      db: this.db,
      provider: new FileMigrationProvider({
        fs,
        migrationFolder: path.join(import.meta.dirname, "..", "migrations"),
        path,
      }),
    });

    const { error, results } = await migrator.migrateToLatest();

    if (results && results.length === 0) {
      this.logger.log("No pending database migrations");
      return;
    }

    results?.forEach((it) => {
      if (it.status === "Success") {
        this.logger.log(
          `Migration "${it.migrationName}" executed successfully`
        );
      } else if (it.status === "Error") {
        this.logger.error(`Failed to execute migration "${it.migrationName}"`);
      }
    });

    if (error) {
      this.logger.error("Failed to run database migration. Exiting program.");
      this.logger.error(error);
      process.exit(1);
    }
  }
}
