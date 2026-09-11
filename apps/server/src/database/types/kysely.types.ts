import { DbInterface } from "@docmost/db/types/db.interface";
import { Kysely, Transaction } from "kysely";

export type KyselyDB = Kysely<DbInterface>;
export type KyselyTransaction = Transaction<DbInterface>;
