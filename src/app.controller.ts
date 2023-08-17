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
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI5NGQ1OWNlZi1kYmI4LTRlYTUtYjE3OC1kMjU0MGZjZDY5MTkiLCJqdGkiOiI2Y2ZiNzM5ZjVmMWY0YzY1N2MwOGVkMTUyOWE2NzQ2ZTEzMGE3NjkwYjhiMGIyMzA2NGZiNTcyOTJkNTVjY2NjODA5ZDVhNjZjZTliODRhMSIsImlhdCI6MTY5MTg1NjE4MC43Njg3NzQsIm5iZiI6MTY5MTg1NjE4MC43Njg3NzYsImV4cCI6MTcyMzQ3ODU4MC43NjIyNzEsInN1YiI6IjEwOTY3ODQiLCJzY29wZXMiOltdfQ.j75ADkD9-HHDDAgI2PSkGpPMTCK2u8wkYOzaroPelBoi7gSW4p61j5tsNbCPqnV0pplJ538wFJB8xnyUAuBzRVUfX3vpp2ANhY3pDau_jjRlx2IkaZmjiQHk4eAy8KucIjHGEEzETISQncnV5Imo6OL0FNhKzXhvAYhohiP1PfoDiLh1e8NH7OKiKyjM1FF8yuQHYm5V3XdnESQa-Tlxbs62EnstwaXVwJmfbD_MDwCUucvzvjb_sgxpxgVEqaj4NSEV1J9kjP7RkdEHniXi9_kWQa7E2F7l5wEPBspuA8A5mb_2QEqOOvIqmpScVM0HtumBSROcE15YUhKvI11rQddtuKMHzXA96tkboxPWL9_HThM-gA_nn9UXr076AADBRWmkhLxADcAlfQ6wGBnAaHdiy61jpsXrkLYLr-owetlq3m2O4DG5Z1Z_mQHHymXc7Y2skg3N77QHb5PgFDqcmny2phx1DCJmEN5ZqIxwvq2PE1q5LK25j_FPeNIvvd7t';

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
    console.log(request.body.data);
    const subscriptionRelationshipResponse = await axios.get(
      `${request.body.data['links']['self']}/relationships/subscription`,
      {
        headers: {
          Authorization: `Bearer ${LEMON_SQUEZY_API}`,
        },
      }
    );
    console.log(subscriptionRelationshipResponse.data.data);
    const subscriptionId = subscriptionRelationshipResponse.data.data.id;
    const { data: responseData } = await axios.get(
      `https://api.lemonsqueezy.com/v1/subscriptions/${subscriptionId}`,
      {
        headers: {
          Authorization: `Bearer ${LEMON_SQUEZY_API}`,
        },
      }
    );
    console.log(responseData.data);
    const attributes = responseData.data.attributes;
    const customerEmail = attributes.user_email;
    const customerId = attributes.customer_id;
    await this.subscriptionService.upsertSubscription(customerEmail, customerId, 'pro');
    return 'Squeezed!';
  }
}
