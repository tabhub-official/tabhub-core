import sgClient, { Client as SendGridClient } from '@sendgrid/client';
// import { ClientRequest } from '@sendgrid/client/src/request';
import sgMail, { MailDataRequired, MailService } from '@sendgrid/mail';
import { EmailTemplate } from 'src/utils/email';
import { autoInjectable, container } from 'tsyringe';

@autoInjectable()
export class EmailService {
  private sendGridMail: MailService;
  private sendGridClient: SendGridClient;

  constructor() {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) throw new Error('Failed to set SendGrid API key');
    sgMail.setApiKey(apiKey);
    sgClient.setApiKey(apiKey);
    this.sendGridMail = sgMail;
    this.sendGridClient = sgClient;
  }

  // // TODO Not implemented in this version yet
  // public async queryEmailsFromSource(source: string, limit: number) {
  //   try {
  //     const queryParams = {
  //       query: `from_email="${source}"`,
  //       limit: limit,
  //     };
  //     const request: ClientRequest = {
  //       url: `/v3/messages`,
  //       method: 'GET',
  //       qs: queryParams,
  //     };
  //     const [response] = await this.sendGridClient.request(request);
  //     this.logService.infoRemote(
  //       `[EMAIL_SERVICE] Fetch email feed activity from ${source}: ${JSON.stringify(response)}`,
  //       {
  //         service: 'email-service',
  //       }
  //     );
  //     return response;
  //   } catch (error: any) {
  //     this.logService.errorRemote(
  //       `[EMAIL_SERVICE] Error query emails sent from ${source}: ${error}`,
  //       {
  //         service: 'email-service',
  //       }
  //     );
  //     throw new Error(`Error query email activity feed: ${error.message}`);
  //   }
  // }

  // TODO Not implemented in this version yet
  // public async getEmailTemplate(subUserUsername: string, template_id: number) {
  //   try {
  //     const headers = {
  //       'on-behalf-of': subUserUsername,
  //     };

  //     const request: ClientRequest = {
  //       url: `/v3/templates/${template_id}`,
  //       method: 'GET',
  //       headers: headers,
  //     };

  //     const [response] = await this.sendGridClient.request(request);
  //     return response;
  //   } catch (error: any) {
  //     this.logService.errorRemote(
  //       `[EMAIL_SERVICE] Error query email template ${template_id}: ${error}`,
  //       {}
  //     );
  //     throw new Error(`Error query email template: ${error.message}`);
  //   }
  // }

  public async sendEmail(template: EmailTemplate): Promise<boolean> {
    try {
      let rawMail: MailDataRequired = {
        to: template.recipient,
        from: template.from,
        replyTo: template.replyTo,
        subject: template.subject,
        html: template.content,
        headers: {
          'List-Unsubscribe': `<mailto:team@tabhub.io>`,
        },
        // headers: {
        //   'List-Unsubscribe': `<mailto:team@tabhub.io>, <http://app.reviewcircle.com/api/unsubscribe?email=${template.recipient}>`,
        // },
      };

      if (template.template_id && template.dynamic_template_data) {
        rawMail = Object.assign(rawMail, {
          templateId: template.template_id,
          personalizations: [
            {
              to: template.recipient,
              dynamicTemplateData: template.dynamic_template_data as any,
            },
          ],
        });
      }

      // this.logService.infoRemote(`[EMAIL_SERVICE] Sending email to ${template.recipient}`, {
      //   service: 'email-service',
      // });

      await this.sendGridMail.send(rawMail);
      return true;
    } catch (error: any) {
      // this.logService.errorRemote(
      //   `[EMAIL_SERVICE] Error sending email to ${template.recipient}: ${error}`,
      //   {
      //     service: 'email-service',
      //   }
      // );
      return false;
    }
  }
}

export const emailService = container.resolve(EmailService);
