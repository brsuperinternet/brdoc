import { Logger } from "@nestjs/common";
import { ServerClient } from "postmark";
import { PostmarkConfig } from "../interfaces";
import { MailMessage } from "../interfaces/mail.message";
import { mailLogName } from "../mail.utils";
import { MailDriver } from "./interfaces/mail-driver.interface";

export class PostmarkDriver implements MailDriver {
  private readonly logger = new Logger(mailLogName(PostmarkDriver.name));
  private readonly postmarkClient: ServerClient;

  constructor(config: PostmarkConfig) {
    this.postmarkClient = new ServerClient(config.postmarkToken);
  }

  async sendMail(message: MailMessage): Promise<void> {
    try {
      await this.postmarkClient.sendEmail({
        From: message.from,
        HtmlBody: message.html,
        Subject: message.subject,
        TextBody: message.text,
        To: message.to,
      });
      this.logger.debug(`Sent mail to ${message.to}`);
    } catch (err) {
      this.logger.warn(`Failed to send mail to ${message.to}: ${err}`);
      throw err;
    }
  }
}
