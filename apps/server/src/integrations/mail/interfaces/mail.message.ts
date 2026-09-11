export interface MailMessage {
  from?: string;
  html?: string;
  notificationId?: string;
  subject: string;
  template?: any;
  text?: string;
  to: string;
}
