import { Logger } from "@nestjs/common";
import * as nodemailer from "nodemailer";
import { Transporter } from "nodemailer";
import { SMTPConfig } from "../interfaces";
import { MailMessage } from "../interfaces/mail.message";
import { mailLogName } from "../mail.utils";
import { MailDriver } from "./interfaces/mail-driver.interface";

export class SmtpDriver implements MailDriver {
  private readonly logger = new Logger(mailLogName(SmtpDriver.name));
  private readonly transporter: Transporter;

  constructor(config: SMTPConfig) {
    this.transporter = nodemailer.createTransport(config);
  }

  async sendMail(message: MailMessage): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: message.from,
        html: message.html,
        subject: message.subject,
        text: message.text,
        to: message.to,
      });

      this.logger.debug(`Sent mail to ${message.to}`);
    } catch (err) {
      this.logger.warn(`Failed to send mail to ${message.to}: ${err}`);
      throw err;
    }
  }
}
