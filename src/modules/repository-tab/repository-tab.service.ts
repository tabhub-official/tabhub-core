import { Injectable } from '@nestjs/common';
import { CollectionRegistry } from 'src/config/firebase-config';
import { RepositoryTabAsInput } from 'src/dto';
import { RepositoryTab } from 'src/models';
import { v4 as uuidV4 } from 'uuid';

import { BaseCRUDService } from '../_base/baseCRUD.service';

@Injectable()
export class RepositoryTabService extends BaseCRUDService<RepositoryTab> {
  constructor() {
    super(CollectionRegistry.RepositoryTab);
  }

  /**
   * Tabs is stored directly to in `tabs` field of repository instead of creating a document record in database
   * If there are around 100 tabs per repo, it is not wise to design this for 100 repositories.
   */
  createManyRepositoryTab = (tabs: RepositoryTabAsInput[]): RepositoryTab[] => {
    const manyData = [];
    for (const tab of tabs) {
      const data = this.createNewRepositoryTab(
        tab.url,
        tab.title,
        tab.favIconUrl,
        tab.parentDirectory,
        tab.customName
      );
      manyData.push(data);
    }
    return manyData;
  };

  createNewRepositoryTab = (
    url: string,
    title: string,
    favIconUrl: string,
    parentDirectory?: string,
    customName?: string
  ): RepositoryTab => {
    const newRepositoryTabId = uuidV4();
    const data: RepositoryTab = {
      id: newRepositoryTabId,
      title,
      favIconUrl,
      customName,
      url,
      pinned: [],
      labels: [],
      parentDirectory,
      description: '',
    };
    return data;
  };
}
