import { Injectable } from '@nestjs/common';
import { CollectionRegistry, db } from 'src/config/firebase-config';
import { RepositoryTabAsInput } from 'src/dto';
import { RepositoryTab } from 'src/models';
import { v4 as uuidV4 } from 'uuid';

import { BaseCRUDService } from '../_base/baseCRUD.service';

@Injectable()
export class RepositoryTabService extends BaseCRUDService<RepositoryTab> {
  constructor() {
    super(CollectionRegistry.RepositoryTab);
  }

  createManyRepositoryTab = async (tabs: RepositoryTabAsInput[]): Promise<RepositoryTab[]> => {
    const manyData = [];
    for (const tab of tabs) {
      const data = await this.createNewRepositoryTab(tab.url, tab.title, tab.favIconUrl, tab.name);
      manyData.push(data);
    }
    return manyData;
  };

  createNewRepositoryTab = async (
    url: string,
    title: string,
    favIconUrl: string,
    customName?: string
  ): Promise<RepositoryTab> => {
    const _collection = await db.collection(this.collectionRegistry);
    const newRepositoryTabId = uuidV4();
    const data: RepositoryTab = {
      id: newRepositoryTabId,
      title,
      favIconUrl,
      customName,
      url,
      pinned: [],
    };
    await _collection.doc(newRepositoryTabId).create(data);
    return data;
  };
}
