import { Readable } from "node:stream";

export interface StorageDriver {
  copy(fromFilePath: string, toFilePath: string): Promise<void>;

  delete(filePath: string): Promise<void>;

  exists(filePath: string): Promise<boolean>;

  getConfig(): Record<string, any>;

  getDriver(): any;

  getDriverName(): string;

  getSignedUrl(filePath: string, expireIn: number): Promise<string>;

  getUrl(filePath: string): string;

  read(filePath: string): Promise<Buffer>;

  readRangeStream(
    filePath: string,
    range: { start: number; end: number }
  ): Promise<Readable>;

  readStream(filePath: string): Promise<Readable>;
  upload(filePath: string, file: Buffer | Readable): Promise<void>;

  uploadStream(
    filePath: string,
    file: Readable,
    options?: { recreateClient?: boolean }
  ): Promise<void>;
}
