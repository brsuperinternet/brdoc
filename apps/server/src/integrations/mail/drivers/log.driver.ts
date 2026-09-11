import * as process from "node:process";
import { Logger } from "@nestjs/common";
import { MailMessage } from "../interfaces/mail.message";
import { mailLogName } from "../mail.utils";
import { MailDriver } from "./interfaces/mail-driver.interface";

export class LogDriver implements MailDriver {
  private readonly logger = new Logger(mailLogName(LogDriver.name));

  async sendMail(message: MailMessage): Promise<void> {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    const mailLog = {
      subject: message.subject,
      text: message.text,
      to: message.to,
    };

    this.logger.log(`Logged email: ${JSON.stringify(mailLog)}`);
  }
}
