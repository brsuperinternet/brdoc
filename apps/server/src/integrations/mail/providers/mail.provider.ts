import SMTPTransport from "nodemailer/lib/smtp-transport";
import { EnvironmentService } from "../../environment/environment.service";
import { LogDriver, PostmarkDriver, SmtpDriver } from "../drivers";
import { MailDriver } from "../drivers/interfaces/mail-driver.interface";
import {
  MailConfig,
  MailOption,
  PostmarkConfig,
  SMTPConfig,
} from "../interfaces";
import { MAIL_CONFIG_TOKEN, MAIL_DRIVER_TOKEN } from "../mail.constants";

function createMailDriver(mail: MailConfig): MailDriver {
  switch (mail.driver) {
    case MailOption.SMTP:
      return new SmtpDriver(mail.config as SMTPConfig);
    case MailOption.Postmark:
      return new PostmarkDriver(mail.config as PostmarkConfig);
    case MailOption.Log:
      return new LogDriver();
    default:
      throw new Error("Unknown mail driver");
  }
}

export const mailDriverConfigProvider = {
  inject: [EnvironmentService],
  provide: MAIL_CONFIG_TOKEN,
  useFactory: async (environmentService: EnvironmentService) => {
    const driver = environmentService.getMailDriver().toLocaleLowerCase();

    switch (driver) {
      case MailOption.SMTP: {
        let auth = undefined;
        if (
          environmentService.getSmtpUsername() &&
          environmentService.getSmtpPassword()
        ) {
          auth = {
            pass: environmentService.getSmtpPassword(),
            user: environmentService.getSmtpUsername(),
          };
        }
        return {
          config: {
            auth,
            connectionTimeout: 30 * 1000, // 30 seconds
            host: environmentService.getSmtpHost(),
            ignoreTLS: environmentService.getSmtpIgnoreTLS(),
            port: environmentService.getSmtpPort(),
            secure: environmentService.getSmtpSecure(),
          } as SMTPTransport.Options,
          driver,
        };
      }

      case MailOption.Postmark:
        return {
          config: {
            postmarkToken: environmentService.getPostmarkToken(),
          } as PostmarkConfig,
          driver,
        };

      case MailOption.Log:
        return {
          driver,
        };
      default:
        throw new Error(`Unknown mail driver: ${driver}`);
    }
  },
};

export const mailDriverProvider = {
  inject: [MAIL_CONFIG_TOKEN],
  provide: MAIL_DRIVER_TOKEN,
  useFactory: (config: MailConfig) => createMailDriver(config),
};
