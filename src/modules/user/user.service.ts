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

  async getUserByEmail(email: string): Promise<User | undefined> {
    const _collection = await db.collection(this.collectionRegistry).where('email', '==', email);
    const _snapshot = await _collection.limit(0).get();
    if (_snapshot.empty) return undefined;
    console.log(_snapshot);
    const user: User = _snapshot.docs[0] as any;
    return user;
  }

  /** Create a new workspace */
  createNewUser = async (
    username: string,
    provider?: string,
    fullName?: string,
    email?: string
  ): Promise<void> => {
    const _collection = await db.collection(this.collectionRegistry);
    const existingUser = await _collection.where('email', '==', email).count().get();
    if (existingUser.data().count > 0) {
      throw new Error('Email is registered already');
    }
    const newUserId = uuidV4();
    const data: Partial<User> = {
      id: newUserId,
      username,
      email,
      provider,
      full_name: fullName,
    };
    await _collection.doc(newUserId).create(data);
  };
}
