import { DynamicModule, Global, Module } from "@nestjs/common";
import { MailModuleOptions } from "./interfaces";
import { MailService } from "./mail.service";
import { EmailProcessor } from "./processors/email.processor";
import {
  mailDriverConfigProvider,
  mailDriverProvider,
} from "./providers/mail.provider";

@Global()
@Module({
  providers: [EmailProcessor],
})
export class MailModule {
  static forRootAsync(options: MailModuleOptions): DynamicModule {
    return {
      exports: [MailService],
      imports: options.imports || [],
      module: MailModule,
      providers: [mailDriverConfigProvider, mailDriverProvider, MailService],
    };
  }
}
