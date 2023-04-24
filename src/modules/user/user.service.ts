import { Injectable } from '@nestjs/common';
import { CollectionRegistry, db } from 'src/config/firebase-config';
import { User } from 'src/models';
import { v4 as uuidV4 } from 'uuid';
import { BaseCRUDService } from '../_base/baseCRUD.service';

@Injectable()
export class UserService extends BaseCRUDService<User> {
  constructor() {
    super(CollectionRegistry.User);
  }

  /** Create a new workspace */
  createNewUser = async (username: string, fullName?: string, email?: string): Promise<void> => {
    const _collection = await db.collection(this.collectionRegistry);
    const newUserId = uuidV4();
    const data: Partial<User> = {
      id: newUserId,
      username,
      email,
      full_name: fullName,
    };
    await _collection.doc(newUserId).create(data);
  };
}
