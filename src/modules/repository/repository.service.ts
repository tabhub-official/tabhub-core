import { Injectable } from '@nestjs/common';
import { CollectionRegistry, db } from 'src/config/firebase-config';
import { Repository } from 'src/models';
import { v4 as uuidV4 } from 'uuid';
import { BaseCRUDService } from '../_base/baseCRUD.service';
import { RepositoryTabService } from '../repository-tab';

@Injectable()
export class RepositoryService extends BaseCRUDService<Repository> {
  constructor(private readonly repositoryTabService: RepositoryTabService) {
    super(CollectionRegistry.Repository);
  }

  createNewRepository = async (
    name: string,
    tabs: { url: string; name?: string }[],
    owner: string,
    workspaceId: string,
    description?: string
  ): Promise<void> => {
    const _collection = await db.collection(this.collectionRegistry);
    const newRepositoryId = uuidV4();
    const repositoryTabs = await this.repositoryTabService.createManyRepositoryTab(tabs);
    const data: Partial<Repository> = {
      id: newRepositoryId,
      name,
      tabs: repositoryTabs,
      description,
      owner,
      workspaceId,
    };
    await _collection.doc(newRepositoryId).create(data);
  };
}
