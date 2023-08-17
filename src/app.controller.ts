import { BadRequestException, Controller, Get, Post, Req } from '@nestjs/common';
import axios from 'axios';

// import * as crypto from 'crypto';
import { AppService } from './app.service';
import RequestWithRawBody from './models/requestWithRawBody.interface';
import { SubscriptionService } from './modules/subscription';

// const LEMON_SQUEEZY_SECRET = 'tabhubofficial2023';

// const verifySigningSecret = (secret: string, request: RequestWithRawBody, _signature: string) => {
//   const hmac = crypto.createHmac('sha256', secret);
//   const digest = Buffer.from(hmac.update(JSON.stringify(request.body)).digest('hex'), 'utf8');
//   const signature = Buffer.from(_signature, 'utf8');
//   if (!crypto.timingSafeEqual(digest, signature)) {
//     throw new Error('Invalid signature.');
//   }
// };

const LEMON_SQUEZY_API =
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI5NGQ1OWNlZi1kYmI4LTRlYTUtYjE3OC1kMjU0MGZjZDY5MTkiLCJqdGkiOiI5NTFhOWZkNTMwMzIwZjUyZDUwNTkxMjE4ZGRmN2MxODYxZDAzZDQzZjQ0NTg3NTkyODg5MWFmZDIxZmUxOTVmY2NmOWVjNzUyYjA5YWFkYSIsImlhdCI6MTY5MjI1NTk1MC42NjU1NzUsIm5iZiI6MTY5MjI1NTk1MC42NjU1NzgsImV4cCI6MTcyMzg3ODM1MC42NTc0NTQsInN1YiI6IjEwOTY3ODQiLCJzY29wZXMiOltdfQ.QcnFXqFEVWxuEO-RO_W5nHa35cPNq4kpVTtDXuHAcrJUcTkMSah2h3zdiqnHbsEzJcIcpaO9yPHdoiN4utGdAPTuX-XeGMXvCSzS6KUAFh-YGrOnMkZZug8ecwYe6UDVcJmfUiinDWEyKKtWviQUuFnbUXzF_7XGP62C3n_tBCX22v_BiQMACrvHhB01fQoPVQvGQjW4QI1UitxOs7LwyAiwqTyg4frF90YW0W_60GFBpl7xFf4l-KqU9xIHgQKNV47_Ki4FAuuuHlsWSsZehae8xl4IaxlNY-Hwl7_NLRmO5sAYNUS3eYFYRn1kl19ppe4SVjUTM7dg69ZHOHsKV14wEI78rVKg-cXz9nuu2JcHoSfVMr66KF-IwQpHLtp3R8JfmuK8iqbtkdaQ2geozhLbrn4JVSwjYRKcLXZinOsztlqDO8X81vWAb_b8P2QWjzxFZG_1OkUXKTsiE9qADNxvcSQoJC5uBqKbbgnz4_H3Y0mNTGC2KkXeG2poNiqk';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly subscriptionService: SubscriptionService
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/subscribed-customer/:email')
  async getSubscribedCustomer(@Req() request: RequestWithRawBody): Promise<boolean> {
    const { params } = request;
    const { email } = params;
    const subscription = await this.subscriptionService.getDataById(email);
    if (!subscription) return false;
    const { data: responseData } = await axios.get(
      `https://api.lemonsqueezy.com/v1/customers/${subscription.customerId}`,
      {
        headers: {
          Authorization: `Bearer ${LEMON_SQUEZY_API}`,
        },
      }
    );
    const isSubscribed = responseData.data.attributes.status === 'subscribed';
    if (isSubscribed && subscription.plan !== 'starter') {
      await this.subscriptionService.updateData(email, {
        plan: 'starter',
      });
    } else if (!isSubscribed && subscription.plan !== 'pro') {
      await this.subscriptionService.updateData(email, {
        plan: 'pro',
      });
    }
    return isSubscribed;
  }

  @Post('/webhook')
  async subscribeLemonSqueezy(@Req() request: RequestWithRawBody) {
    const signature = request.headers['x-signature'];
    if (!signature) {
      throw new BadRequestException('Missing lemon-squeezy-signature header');
    }
    const responseData = request.body.data;
    const attributes = responseData.attributes;
    const customerEmail = attributes.user_email;
    const customerId = attributes.customer_id;
    await this.subscriptionService.upsertSubscription(customerEmail, customerId, 'pro');
    return 'Squeezed!';
  }
}
