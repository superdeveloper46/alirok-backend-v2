import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';

@Injectable()
export class SendgridService {
  private sendgridApiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.sendgridApiKey = this.configService.get('SENDGRID_API_KEY');

    sgMail.setApiKey(this.sendgridApiKey);
  }
  async send({ templateId, subject, to, cc, data }: Record<string, any>) {
    const createBody = {
      from: {
        email: 'noreply@alirok.com',
        name: 'Alirok',
      },
      templateId,
      to,
      dynamic_template_data: {
        subject,
        ...data,
      },
    };

    if (cc) {
      createBody['cc'] = {
        email: cc,
      };
    }

    try {
      await sgMail.send(createBody);
      return true;
    } catch (err) {
      return false;
    }
  }
}
