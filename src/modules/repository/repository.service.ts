import { Injectable } from '@nestjs/common';
import { CollectionRegistry, db } from 'src/config/firebase-config';
import { Repository } from 'src/models';
import { v4 as uuidV4 } from 'uuid';
import { BaseCRUDService } from '../_base/baseCRUD.service';

@Injectable()
export class RepositoryService extends BaseCRUDService<Repository> {
  constructor() {
    super(CollectionRegistry.Repository);
  }

  createNewRepository = async (
    name: string,
    tabs: string[],
    owner: string,
    description?: string
  ): Promise<void> => {
    const _collection = await db.collection(this.collectionRegistry);
    const newUserId = uuidV4();
    const data: Partial<Repository> = {
      id: newUserId,
      name,
      tabs,
      description,
      owner,
    };
    await _collection.doc(newUserId).create(data);
  };
}
