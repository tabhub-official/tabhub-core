import { Injectable } from '@nestjs/common';
import { CollectionRegistry, db } from 'src/config/firebase-config';
import { RepositoryTab } from 'src/models';
import { v4 as uuidV4 } from 'uuid';
import { BaseCRUDService } from '../_base/baseCRUD.service';

@Injectable()
export class RepositoryTabService extends BaseCRUDService<RepositoryTab> {
  constructor() {
    super(CollectionRegistry.RepositoryTab);
  }

  createNewRepositoryTab = async (url: string, name?: string): Promise<void> => {
    const _collection = await db.collection(this.collectionRegistry);
    const newRepositoryTab = uuidV4();
    const data: Partial<RepositoryTab> = {
      id: newRepositoryTab,
      name,
      url,
      pinned: [],
    };
    await _collection.doc(newRepositoryTab).create(data);
  };
}
