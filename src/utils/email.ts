export class EmailTemplate {
  recipient: string;
  from: string;
  subject: string;
  template_id?: number;
  content?: string;
  dynamic_template_data?: { [key: string]: any };
  replyTo?: string;

  constructor(
    recipient: string,
    from: string,
    subject: string,
    template_id?: number,
    dynamic_template_data?: { [key: string]: any },
    replyTo?: string
  ) {
    this.recipient = recipient;
    this.from = from;
    this.subject = subject;
    this.template_id = template_id;
    this.dynamic_template_data = dynamic_template_data;
    this.replyTo = replyTo;
  }
}
