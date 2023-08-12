import moment from 'moment';
import { CollectionRegistry, db } from 'src/config';
import { Subscription } from 'src/models/subscription.model';

import { BaseCRUDService } from '../_base/baseCRUD.service';

export class SubscriptionService extends BaseCRUDService<Subscription> {
  constructor() {
    super(CollectionRegistry.Subscription);
  }

  async upsertSubscription(email: string, customerId: string, plan: string) {
    const data = await this.getDataById(email);
    if (data)
      return this.updateData(email, {
        email,
        plan,
        updated_date: moment().unix(),
      });
    return this.createNewSubscription(email, customerId, plan);
  }

  async createNewSubscription(email: string, customerId: string, plan: string) {
    const _collection = await db.collection(this.collectionRegistry);
    await _collection.doc(email).create({
      email,
      plan,
      customerId,
      created_date: moment().unix(),
      updated_date: moment().unix(),
    } as Subscription);
  }
}
