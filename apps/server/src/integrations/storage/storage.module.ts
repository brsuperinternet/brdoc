import { DynamicModule, Global, Module } from "@nestjs/common";
import { StorageModuleOptions } from "./interfaces";
import {
  storageDriverConfigProvider,
  storageDriverProvider,
} from "./providers/storage.provider";
import { StorageService } from "./storage.service";

@Global()
@Module({})
export class StorageModule {
  static forRootAsync(options: StorageModuleOptions): DynamicModule {
    return {
      exports: [StorageService],
      imports: options.imports || [],
      module: StorageModule,
      providers: [
        storageDriverConfigProvider,
        storageDriverProvider,
        StorageService,
      ],
    };
  }
}
